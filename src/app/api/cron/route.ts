import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { cancelDirectChargePaymentIntent } from "@/lib/stripe/connect";
import { ensurePayoutRecordForBooking, isProviderPayoutAutoReleaseEnabled, refreshPayoutRecordState } from "@/lib/payouts";
import { sendLoggedEmail } from "@/lib/notifications/logged-email";
import { getOpsNotificationRecipients } from "@/lib/notifications/ops";

// L-H FIX: Named timing constants instead of magic numbers
const ABANDONED_BOOKING_CUTOFF_MS = 2 * 60 * 60 * 1000; // 2 hours
const CONFIRMATION_CUTOFF_MS = 24 * 60 * 60 * 1000; // 24 hours
const COUNTER_OFFER_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours
const TOKEN_CLEANUP_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

    // 1. Abandoned checkout reminders — sent shortly before the 2h cancellation window
    const abandonedReminderStart = new Date(now.getTime() - (ABANDONED_BOOKING_CUTOFF_MS - 30 * 60 * 1000));
    const abandonedReminderTargets = await prisma.booking.findMany({
      where: {
        bookingStatus: "AWAITING_PAYMENT",
        createdAt: { lte: abandonedReminderStart, gt: new Date(now.getTime() - ABANDONED_BOOKING_CUTOFF_MS) },
      },
      select: {
        id: true,
        customer: { select: { email: true } },
        quoteRequest: { select: { reference: true } },
      },
      take: 200,
    });
    let abandonedReminders = 0;
    for (const booking of abandonedReminderTargets) {
      const alreadySent = await prisma.notificationLogV2.findFirst({
        where: { bookingId: booking.id, templateCode: "customer_abandoned_booking_reminder" },
      });
      if (alreadySent || !booking.customer?.email) continue;
      try {
        const { sendAbandonedBookingReminderEmail } = await import("@/lib/notifications/booking-emails");
        await sendAbandonedBookingReminderEmail(booking.id);
        await prisma.notificationLogV2.create({
          data: {
            bookingId: booking.id,
            channel: "EMAIL",
            status: "SENT",
            recipient: booking.customer.email,
            subject: `Complete your booking — ${booking.quoteRequest?.reference || booking.id.slice(0, 8)}`,
            templateCode: "customer_abandoned_booking_reminder",
            payloadJson: {},
          },
        });
        abandonedReminders += 1;
      } catch {
        // Non-critical
      }
    }
    results.abandonedReminders = abandonedReminders;

    // 2. Abandoned checkouts — AWAITING_PAYMENT for >2 hours
    const abandonedCutoff = new Date(now.getTime() - ABANDONED_BOOKING_CUTOFF_MS);
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

    // 3. Pending-assignment escalation alerts before auth hold expiry
    const confirmationCutoff = new Date(now.getTime() - CONFIRMATION_CUTOFF_MS);
    const pendingEscalationStart = new Date(now.getTime() - (CONFIRMATION_CUTOFF_MS - 2 * 60 * 60 * 1000));
    const escalationBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: "PENDING_ASSIGNMENT",
        createdAt: { lte: pendingEscalationStart, gt: confirmationCutoff },
      },
      select: {
        id: true,
        servicePostcode: true,
        quoteRequest: { select: { reference: true, serviceKey: true } },
      },
      take: 200,
    });
    const opsRecipients = await getOpsNotificationRecipients();
    let pendingEscalations = 0;
    for (const booking of escalationBookings) {
      const alreadySent = await prisma.notificationLogV2.findFirst({
        where: { bookingId: booking.id, templateCode: "ops_pending_assignment_escalation" },
      });
      if (alreadySent) continue;

      await Promise.allSettled(opsRecipients.map((to) => sendLoggedEmail({
        to,
        subject: `Booking still pending provider confirmation — ${booking.quoteRequest?.reference || booking.id.slice(0, 8)}`,
        text: [
          `A booking is approaching the confirmation deadline and still has no provider confirmation.`,
          "",
          `Reference: ${booking.quoteRequest?.reference || booking.id.slice(0, 8)}`,
          `Service: ${booking.quoteRequest?.serviceKey || "Service"}`,
          `Postcode: ${booking.servicePostcode}`,
          `Review here: ${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/admin/orders/${booking.id}`,
        ].join("\n"),
        templateCode: "ops_pending_assignment_escalation",
        bookingId: booking.id,
        payload: {},
      })));
      pendingEscalations += 1;
    }
    results.pendingAssignmentEscalations = pendingEscalations;

    // 4. Expire unconfirmed booking holds after 24 hours
    // H-23 FIX: Use createdAt instead of updatedAt for auth hold expiry.
    // updatedAt resets on any booking field change (reschedule, counter-offer, etc.)
    // which could extend the hold window beyond the intended 24 hours.
    const expiredAuthorisations = await prisma.booking.findMany({
      where: {
        bookingStatus: "PENDING_ASSIGNMENT",
        createdAt: { lt: confirmationCutoff },
      },
      include: {
        paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
      },
    });

    let releasedAuthorisations = 0;

    // H-36 FIX: Cancel Stripe PIs in parallel with Promise.allSettled to avoid N+1
    const cancelPromises = expiredAuthorisations.map(async (booking) => {
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
    });
    await Promise.allSettled(cancelPromises);

    for (const booking of expiredAuthorisations) {
      // H7 FIX: Add status guard to prevent overwriting if provider accepted
      // between the findMany and this update.
      const updateResult = await prisma.booking.updateMany({
        where: { id: booking.id, bookingStatus: "PENDING_ASSIGNMENT" },
        data: {
          bookingStatus: "NO_CLEANER_FOUND",
          cancelledByType: "SYSTEM",
          cancelledReason: "Provider did not confirm within 24 hours",
        },
      });

      if (updateResult.count === 0) {
        // Booking was accepted/cancelled in the meantime, skip cleanup
        continue;
      }
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

    // 5. Expired counter-offers — PENDING for >48 hours
    const offerCutoff = new Date(now.getTime() - COUNTER_OFFER_EXPIRY_MS);
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

    // 6. Clean up old consumed/expired auth tokens (>7 days)
    const tokenCutoff = new Date(now.getTime() - TOKEN_CLEANUP_AGE_MS);
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

    // 7. Refresh provider payout hold states for captured bookings
    const paidBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: { in: ["PAID", "ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
        providerCompanyId: { not: null },
        paymentRecords: { some: { paymentState: "PAID" } },
      },
      select: { id: true },
      take: 500,
    });

    const autoReleaseEnabled = await isProviderPayoutAutoReleaseEnabled(prisma);
    let payoutEligible = 0;
    let payoutReleased = 0;

    for (const booking of paidBookings) {
      const payout = await ensurePayoutRecordForBooking(booking.id, prisma);
      if (!payout) continue;
      const refreshed = await refreshPayoutRecordState(payout.id, prisma);
      if (!refreshed) continue;
      if (refreshed.status === "ELIGIBLE") payoutEligible += 1;

      if (autoReleaseEnabled && refreshed.status === "ELIGIBLE") {
        await prisma.payoutRecord.update({
          where: { id: refreshed.id },
          data: { status: "RELEASED", releasedAt: new Date() },
        });
        payoutReleased += 1;
      }
    }
    results.payoutEligible = payoutEligible;
    results.payoutReleased = payoutReleased;

    // 8. Booking reminders (24h window)
    const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: { in: ["ASSIGNED", "IN_PROGRESS"] },
        scheduledDate: { gte: reminderWindowStart, lte: reminderWindowEnd },
      },
      select: {
        id: true,
        scheduledDate: true,
        scheduledStartTime: true,
        servicePostcode: true,
        customer: { select: { email: true, firstName: true } },
        marketplaceProviderCompany: { select: { id: true, contactEmail: true, tradingName: true, legalName: true } },
        quoteRequest: { select: { reference: true, serviceKey: true } },
      },
      take: 200,
    });
    let customerReminders = 0;
    let providerReminders = 0;
    for (const booking of upcomingBookings) {
      const alreadySent = await prisma.notificationLogV2.findMany({
        where: {
          bookingId: booking.id,
          templateCode: { in: ["customer_booking_reminder_24h", "provider_booking_reminder_24h"] },
        },
        select: { templateCode: true },
      });
      const sentTemplates = new Set(alreadySent.map((item) => item.templateCode));

      if (booking.customer?.email && !sentTemplates.has("customer_booking_reminder_24h")) {
        await sendLoggedEmail({
          to: booking.customer.email,
          subject: `Booking reminder — ${booking.quoteRequest?.reference || booking.id.slice(0, 8)}`,
          text: [
            `Hi ${booking.customer.firstName},`,
            "",
            `This is a reminder that your booking is scheduled for tomorrow.`,
            `Service: ${booking.quoteRequest?.serviceKey || "Service"}`,
            `Date: ${new Date(booking.scheduledDate).toLocaleDateString("en-GB")}`,
            `Time: ${booking.scheduledStartTime || "To be confirmed"}`,
            `Postcode: ${booking.servicePostcode}`,
          ].join("\n"),
          templateCode: "customer_booking_reminder_24h",
          bookingId: booking.id,
        });
        customerReminders += 1;
      }

      if (booking.marketplaceProviderCompany?.contactEmail && !sentTemplates.has("provider_booking_reminder_24h")) {
        await sendLoggedEmail({
          to: booking.marketplaceProviderCompany.contactEmail,
          subject: `Job reminder — ${booking.quoteRequest?.reference || booking.id.slice(0, 8)}`,
          text: [
            `Reminder: you have an AreaSorted booking scheduled for tomorrow.`,
            "",
            `Reference: ${booking.quoteRequest?.reference || booking.id.slice(0, 8)}`,
            `Date: ${new Date(booking.scheduledDate).toLocaleDateString("en-GB")}`,
            `Time: ${booking.scheduledStartTime || "To be confirmed"}`,
            `Postcode: ${booking.servicePostcode}`,
          ].join("\n"),
          templateCode: "provider_booking_reminder_24h",
          bookingId: booking.id,
          providerCompanyId: booking.marketplaceProviderCompany.id,
        });
        providerReminders += 1;
      }
    }
    results.customerReminders = customerReminders;
    results.providerReminders = providerReminders;

    // 9. Unfinished onboarding reminders
    const onboardingCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const onboardingProviders = await prisma.providerCompany.findMany({
      where: {
        status: { in: ["EMAIL_VERIFICATION_PENDING", "PASSWORD_SETUP_PENDING", "ONBOARDING_IN_PROGRESS", "CHANGES_REQUESTED"] },
        updatedAt: { lt: onboardingCutoff },
      },
      select: {
        id: true,
        contactEmail: true,
        legalName: true,
        status: true,
        updatedAt: true,
      },
      take: 200,
    });

    let onboardingReminders = 0;
    for (const provider of onboardingProviders) {
      const alreadySent = await prisma.notificationLogV2.findFirst({
        where: {
          providerCompanyId: provider.id,
          templateCode: "provider_onboarding_reminder",
          createdAt: { gte: onboardingCutoff },
        },
      });
      if (alreadySent || !provider.contactEmail) continue;

      await sendLoggedEmail({
        to: provider.contactEmail,
        subject: "Complete your AreaSorted provider onboarding",
        text: [
          `Hi,`,
          "",
          `Your provider application is still incomplete and waiting for the next step.`,
          `Current status: ${provider.status}`,
          "",
          `Continue here: ${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/provider/onboarding`,
        ].join("\n"),
        templateCode: "provider_onboarding_reminder",
        providerCompanyId: provider.id,
      });
      onboardingReminders += 1;
    }
    results.onboardingReminders = onboardingReminders;

    // M-3 FIX: Don't return internal cleanup counts — only return generic OK
    if (process.env.NODE_ENV !== "production") {
      console.log("[CRON] Completed:", JSON.stringify(results));
    }
    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    // H-29 FIX: Don't leak internal error messages in production
    const message = error instanceof Error ? error.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") {
      console.error("[CRON] Error:", message);
    }
    return NextResponse.json({ error: "Internal cron error" }, { status: 500 });
  }
}
