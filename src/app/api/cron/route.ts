import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { cancelDirectChargePaymentIntent } from "@/lib/stripe/connect";

/**
 * Cron endpoint for cleaning up stale data:
 * 1. Abandoned checkouts — bookings stuck in AWAITING_PAYMENT for >2 hours
 * 2. Expired counter-offers — PENDING offers older than 48 hours
 * 3. Expired auth tokens cleanup
 *
 * Intended to be called via Vercel cron or external scheduler.
 * Protected by CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const authHeader = request.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;

    if (env.NODE_ENV === "production" && !cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
    }

    // In development, allow unauthenticated calls only when no secret is configured.
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrisma();
    const now = new Date();
    const results: Record<string, number> = {};

    // 1. Abandoned checkouts — AWAITING_PAYMENT for >2 hours
    const abandonedCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const abandonedResult = await prisma.booking.updateMany({
      where: {
        bookingStatus: "AWAITING_PAYMENT",
        createdAt: { lt: abandonedCutoff },
      },
      data: {
        bookingStatus: "CANCELLED",
        cancelledByType: "SYSTEM",
        cancelledReason: "Payment not completed within 2 hours",
      },
    });
    results.abandonedCheckouts = abandonedResult.count;

    // 2. Expire unconfirmed booking holds after 24 hours
    const confirmationCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const expiredAuthorisations = await prisma.booking.findMany({
      where: {
        bookingStatus: "PENDING_ASSIGNMENT",
        updatedAt: { lt: confirmationCutoff },
      },
      include: {
        paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
      },
    });

    let releasedAuthorisations = 0;
    for (const booking of expiredAuthorisations) {
      const paymentRecord = booking.paymentRecords[0];
      const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

      if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
        try {
          await cancelDirectChargePaymentIntent({
            connectedAccountId: stripeAccountId,
            paymentIntentId: paymentRecord.stripePaymentIntentId,
          });
        } catch {
          // Non-critical; continue to local cleanup so stale bookings do not linger.
        }
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: "NO_CLEANER_FOUND",
          cancelledByType: "SYSTEM",
          cancelledReason: "Provider did not confirm within 24 hours",
        },
      });
      await prisma.paymentRecord.updateMany({
        where: { bookingId: booking.id },
        data: { paymentState: "CANCELLED" },
      });

      try {
        const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
        await sendBookingStatusEmail(booking.id, "NO_CLEANER_FOUND");
      } catch {
        // Non-critical
      }
      releasedAuthorisations += 1;
    }
    results.expiredAuthorisations = releasedAuthorisations;

    // 3. Expired counter-offers — PENDING for >48 hours
    const offerCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const expiredOffers = await prisma.counterOffer.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: offerCutoff },
      },
      data: {
        status: "EXPIRED",
        respondedAt: now,
      },
    });
    results.expiredCounterOffers = expiredOffers.count;

    // Notify providers about expired offers
    if (expiredOffers.count > 0) {
      try {
        const justExpired = await prisma.counterOffer.findMany({
          where: {
            status: "EXPIRED",
            respondedAt: { gte: new Date(now.getTime() - 60 * 1000) },
          },
          select: { providerCompanyId: true, bookingId: true },
        });

        const { createProviderNotification } = await import("@/lib/providers/notifications");
        for (const offer of justExpired) {
          try {
            await createProviderNotification({
              providerCompanyId: offer.providerCompanyId,
              type: "COUNTER_OFFER_RESPONSE",
              title: "Counter offer expired",
              message: "Your counter offer has expired because the customer did not respond within 48 hours.",
              link: `/provider/orders/${offer.bookingId}`,
              bookingId: offer.bookingId,
            });
          } catch {
            // Non-critical
          }
        }
      } catch {
        // Non-critical
      }
    }

    // 4. Clean up old consumed/expired auth tokens (>7 days)
    const tokenCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deletedCustomerTokens = await prisma.customerAuthToken.deleteMany({
      where: {
        OR: [
          { consumedAt: { not: null }, createdAt: { lt: tokenCutoff } },
          { expiresAt: { lt: now }, createdAt: { lt: tokenCutoff } },
        ],
      },
    });
    results.cleanedCustomerTokens = deletedCustomerTokens.count;

    const deletedProviderTokens = await prisma.providerAuthToken.deleteMany({
      where: {
        OR: [
          { consumedAt: { not: null }, createdAt: { lt: tokenCutoff } },
          { expiresAt: { lt: now }, createdAt: { lt: tokenCutoff } },
        ],
      },
    });
    results.cleanedProviderTokens = deletedProviderTokens.count;

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
