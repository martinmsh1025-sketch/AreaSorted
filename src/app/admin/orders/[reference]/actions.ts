"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { isAdminAuthenticated, requireAdminSession } from "@/lib/admin-auth";
import { captureDirectChargePaymentIntent, cancelDirectChargePaymentIntent, createDirectChargeRefund } from "@/lib/stripe/connect";
import type { BookingStatus } from "@prisma/client";

// C-10 FIX: Whitelist of valid BookingStatus values
const VALID_BOOKING_STATUSES: Set<BookingStatus> = new Set([
  "AWAITING_PAYMENT", "PAID", "PENDING_ASSIGNMENT", "ACCEPTING",
  "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED",
  "NO_CLEANER_FOUND", "REFUND_PENDING", "REFUNDED",
]);

export async function updateBookingStatusAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const bookingId = String(formData.get("bookingId") || "");

  if (!bookingId) return;

  const prisma = getPrisma();

  const bookingStatus = String(formData.get("bookingStatus") || "AWAITING_PAYMENT");

  // C-10 FIX: Validate against enum whitelist instead of `as any` cast
  if (!VALID_BOOKING_STATUSES.has(bookingStatus as BookingStatus)) {
    throw new Error(`Invalid booking status: ${bookingStatus}`);
  }

  // C-11 FIX: Validate financial fields are non-negative numbers
  const cleanerPayoutAmount = Number(formData.get("cleanerPayoutAmount") || 0);
  const platformMarginAmount = Number(formData.get("platformMarginAmount") || 0);

  if (isNaN(cleanerPayoutAmount) || cleanerPayoutAmount < 0 || cleanerPayoutAmount > 100000) {
    throw new Error("Invalid cleaner payout amount");
  }
  if (isNaN(platformMarginAmount) || platformMarginAmount < 0 || platformMarginAmount > 100000) {
    throw new Error("Invalid platform margin amount");
  }

  // H-28 FIX: Guard financial status transitions — perform corresponding Stripe
  // operations when admin sets statuses that have financial implications.
  const currentBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      bookingStatus: true,
      paymentRecords: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: {
          stripePaymentIntentId: true,
          stripeAccountId: true,
          paymentState: true,
        },
      },
      marketplaceProviderCompany: {
        select: { stripeConnectedAccount: { select: { stripeAccountId: true } } },
      },
    },
  });

  if (!currentBooking) throw new Error("Booking not found");

  const pr = currentBooking.paymentRecords[0];
  const stripeAccountId = pr?.stripeAccountId
    || currentBooking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  if (pr?.stripePaymentIntentId && stripeAccountId) {
    // Transitioning TO CANCELLED: cancel auth or refund captured payment
    if (bookingStatus === "CANCELLED" && currentBooking.bookingStatus !== "CANCELLED") {
      if (pr.paymentState === "PENDING") {
        try {
          await cancelDirectChargePaymentIntent({
            connectedAccountId: stripeAccountId,
            paymentIntentId: pr.stripePaymentIntentId,
          });
          await prisma.paymentRecord.updateMany({
            where: { bookingId },
            data: { paymentState: "CANCELLED" },
          });
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[H-28] Failed to cancel PI for booking ${bookingId}`);
          }
        }
      } else if (pr.paymentState === "PAID") {
        try {
          await createDirectChargeRefund({
            connectedAccountId: stripeAccountId,
            paymentIntentId: pr.stripePaymentIntentId,
            reason: "requested_by_customer",
          });
          await prisma.paymentRecord.updateMany({
            where: { bookingId },
            data: { paymentState: "REFUNDED" },
          });
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[H-28] Failed to refund PI for booking ${bookingId} — marking REFUND_PENDING`);
          }
          // Override status to REFUND_PENDING so admin knows it needs manual resolution
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              bookingStatus: "REFUND_PENDING",
              cleanerPayoutAmount,
              platformMarginAmount,
            },
          });
          revalidatePath(`/admin/orders/${bookingId}`);
          revalidatePath("/admin/orders");
          return; // Don't proceed with the normal update
        }
      }
    }

    // Transitioning TO REFUNDED: issue refund if payment was captured
    if (bookingStatus === "REFUNDED" && currentBooking.bookingStatus !== "REFUNDED") {
      if (pr.paymentState === "PAID") {
        try {
          await createDirectChargeRefund({
            connectedAccountId: stripeAccountId,
            paymentIntentId: pr.stripePaymentIntentId,
            reason: "requested_by_customer",
          });
          await prisma.paymentRecord.updateMany({
            where: { bookingId },
            data: { paymentState: "REFUNDED" },
          });
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[H-28] Failed to refund PI for booking ${bookingId}`);
          }
          throw new Error("Refund failed — please process manually via Stripe dashboard");
        }
      }
    }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: bookingStatus as BookingStatus,
      cleanerPayoutAmount,
      platformMarginAmount,
    },
  });

  // Send status email for key transitions
  const emailStatuses = ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  if (emailStatuses.includes(bookingStatus)) {
    try {
      const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
      await sendBookingStatusEmail(bookingId, bookingStatus);
    } catch { /* non-critical */ }
  }

  revalidatePath(`/admin/orders/${bookingId}`);
  revalidatePath("/admin/orders");
}

export async function confirmBookingOnBehalfAction(formData: FormData) {
  await requireAdminSession();
  const bookingId = String(formData.get("bookingId") || "");

  if (!bookingId) return;

  const prisma = getPrisma();

  // H-27 FIX: Atomically claim the booking via updateMany to prevent race conditions.
  // This ensures two concurrent admin actions can't both capture the same booking.
  const claimResult = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      bookingStatus: "PENDING_ASSIGNMENT",
    },
    data: { bookingStatus: "ACCEPTING" },
  });

  if (claimResult.count === 0) {
    throw new Error("Booking is not waiting for provider confirmation (may have been claimed concurrently)");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking) {
    // Roll back the claim
    await prisma.booking.updateMany({
      where: { id: bookingId, bookingStatus: "ACCEPTING" },
      data: { bookingStatus: "PENDING_ASSIGNMENT" },
    });
    throw new Error("Booking not found");
  }

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
    try {
      await captureDirectChargePaymentIntent({
        connectedAccountId: stripeAccountId,
        paymentIntentId: paymentRecord.stripePaymentIntentId,
      });
    } catch (captureError) {
      // Roll back the claim
      await prisma.booking.updateMany({
        where: { id: bookingId, bookingStatus: "ACCEPTING" },
        data: { bookingStatus: "PENDING_ASSIGNMENT" },
      });
      throw captureError;
    }
  } else {
    await prisma.paymentRecord.updateMany({
      where: { bookingId },
      data: { paymentState: "PAID" },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "ASSIGNED",
        cancelledByType: null,
        cancelledReason: null,
      },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    if (latestJob) {
      await tx.job.update({
        where: { id: latestJob.id },
        data: {
          jobStatus: "ACCEPTED",
          acceptedAt: latestJob.acceptedAt ?? new Date(),
        },
      });
    } else {
      await tx.job.create({
        data: {
          bookingId,
          jobStatus: "ACCEPTED",
          dispatchRound: 1,
          acceptedAt: new Date(),
        },
      });
    }
  });

  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "ASSIGNED");
  } catch {
    // Non-critical
  }

  revalidatePath(`/admin/orders/${bookingId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/bookings");
  revalidatePath(`/provider/orders/${bookingId}`);
  revalidatePath("/provider/orders");
}

// Counter offers are now handled directly between providers and customers.
// Admin has read-only visibility — no accept/reject actions needed.
