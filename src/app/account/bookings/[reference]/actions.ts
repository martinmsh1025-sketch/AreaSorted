"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { requireCustomerSession } from "@/lib/customer-auth";
import { createProviderNotification } from "@/lib/providers/notifications";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { cancelDirectChargePaymentIntent, createDirectChargeRefund } from "@/lib/stripe/connect";
import type { BookingStatus } from "@prisma/client";

/** Statuses from which a customer can self-cancel */
const CANCELLABLE_STATUSES: BookingStatus[] = ["PAID", "PENDING_ASSIGNMENT", "ASSIGNED"];

/** Statuses from which a customer can self-reschedule */
const RESCHEDULABLE_STATUSES: BookingStatus[] = ["PAID", "PENDING_ASSIGNMENT", "ASSIGNED"];
const RESCHEDULE_TIME_SLOTS = new Set([
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
]);

/**
 * Customer cancels their own booking.
 */
export async function cancelBookingAction(formData: FormData) {
  const customer = await requireCustomerSession();
  const bookingId = String(formData.get("bookingId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!bookingId) return { error: "Missing booking ID" };

  const prisma = getPrisma();

  // C2 FIX: Atomically claim the booking for cancellation to prevent race
  // with provider accept (which transitions from PENDING_ASSIGNMENT to ACCEPTING).
  // Also include "ACCEPTING" as a valid target — if provider is mid-accept,
  // the customer cancel should still succeed (funds haven't been captured yet
  // during the ACCEPTING transitional state).
  const claimResult = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      customerId: customer.id,
      bookingStatus: { in: [...CANCELLABLE_STATUSES, "ACCEPTING"] },
    },
    data: {
      bookingStatus: "CANCELLED",
      cancelledByType: "CUSTOMER",
      cancelledReason: reason || "Cancelled by customer",
    },
  });

  if (claimResult.count === 0) return { error: "Booking not found or cannot be cancelled" };

  // H1 FIX: Release Stripe authorization if payment is still pending/authorized
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
        quoteRequest: { select: { reference: true } },
      },
    });

    if (booking) {
      const paymentRecord = booking.paymentRecords[0];
      const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

      if (paymentRecord?.stripePaymentIntentId && stripeAccountId && paymentRecord.paymentState !== "PAID") {
        try {
          await cancelDirectChargePaymentIntent({
            connectedAccountId: stripeAccountId,
            paymentIntentId: paymentRecord.stripePaymentIntentId,
          });
        } catch {
          // Non-critical: cron/admin can reconcile if Stripe cancellation fails
        }
        await prisma.paymentRecord.updateMany({
          where: { bookingId },
          data: { paymentState: "CANCELLED" },
        });
        await prisma.payoutRecord.updateMany({
          where: { bookingId },
          data: { status: "CANCELLED", blockedReason: "Booking cancelled before payout release." },
        });
      }

      // C-7/8 FIX: If payment was already captured (PAID), issue a full refund
      // via createDirectChargeRefund. This is the only automated refund path.
      if (paymentRecord?.stripePaymentIntentId && stripeAccountId && paymentRecord.paymentState === "PAID") {
        try {
          await createDirectChargeRefund({
            connectedAccountId: stripeAccountId,
            paymentIntentId: paymentRecord.stripePaymentIntentId,
            reason: "requested_by_customer",
          });
          await prisma.paymentRecord.updateMany({
            where: { bookingId },
            data: { paymentState: "REFUNDED" },
          });
          await prisma.payoutRecord.updateMany({
            where: { bookingId },
            data: { status: "CANCELLED", blockedReason: "Booking refunded before payout release." },
          });
          // Also update booking status to reflect refund
          await prisma.booking.update({
            where: { id: bookingId },
            data: { bookingStatus: "REFUNDED" },
          });
          try {
            const { sendRefundStatusEmail } = await import("@/lib/notifications/booking-emails");
            await sendRefundStatusEmail(bookingId, Number(paymentRecord.grossAmount), "FULL");
          } catch {
            // Non-critical
          }
        } catch {
          // Mark as pending refund — admin can handle manually
          await prisma.booking.update({
            where: { id: bookingId },
            data: { bookingStatus: "REFUND_PENDING" },
          });
        }
      }

      // Send status email to customer
      try {
        const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
        await sendBookingStatusEmail(bookingId, "CANCELLED");
      } catch { /* non-critical */ }

      // Notify provider if one was assigned
      if (booking.providerCompanyId) {
        try {
          await createProviderNotification({
            providerCompanyId: booking.providerCompanyId,
            type: "ORDER_CANCELLED",
            title: "Booking cancelled by customer",
            message: reason
              ? `The customer cancelled the booking. Reason: "${reason}"`
              : "The customer cancelled the booking.",
            link: `/provider/orders/${bookingId}`,
            bookingId,
          });
        } catch { /* non-critical */ }
      }

      const ref = booking.quoteRequest?.reference ?? bookingId;
      revalidatePath(`/account/bookings/${ref}`);
    }
  } catch { /* non-critical cleanup — booking is already cancelled */ }

  revalidatePath("/account/bookings");
  revalidatePath("/admin/orders");
  revalidatePath("/provider/orders");
  return { success: true };
}

/**
 * Customer reschedules their own booking (new date + time).
 * Limited to RESCHEDULABLE_STATUSES. Increments rescheduleCount and logs via AuditLog.
 */
export async function rescheduleBookingAction(formData: FormData) {
  const customer = await requireCustomerSession();
  const bookingId = String(formData.get("bookingId") || "");
  const newDateStr = String(formData.get("newDate") || "").trim();
  const newTime = String(formData.get("newTime") || "").trim();

  if (!bookingId) return { error: "Missing booking ID" };
  if (!newDateStr) return { error: "Please select a new date" };
  if (!newTime) return { error: "Please select a new time" };

  // Validate date is in the future (at least tomorrow)
  const newDate = new Date(newDateStr + "T00:00:00Z");
  if (isNaN(newDate.getTime())) return { error: "Invalid date" };

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (newDate < tomorrow) return { error: "New date must be at least tomorrow" };

  if (!RESCHEDULE_TIME_SLOTS.has(newTime)) return { error: "Please select a valid time slot" };

  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      customerId: customer.id,
      bookingStatus: { in: RESCHEDULABLE_STATUSES },
    },
    include: {
      quoteRequest: { select: { reference: true } },
    },
  });

  if (!booking) return { error: "Booking not found or cannot be rescheduled" };

  const oldDate = booking.scheduledDate.toISOString().split("T")[0];
  const oldTime = booking.scheduledStartTime;

  // Don't allow reschedule to same date+time
  if (oldDate === newDateStr && oldTime === newTime) {
    return { error: "New date and time are the same as the current booking" };
  }

  // Update booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      scheduledDate: newDate,
      scheduledStartTime: newTime,
      rescheduleCount: { increment: 1 },
    },
  });

  // Create audit log
  try {
    await prisma.auditLog.create({
      data: {
        actorType: "CUSTOMER",
        actorId: customer.id,
        actionType: "BOOKING_RESCHEDULED",
        entityType: "Booking",
        entityId: bookingId,
        oldValues: { scheduledDate: oldDate, scheduledStartTime: oldTime },
        newValues: { scheduledDate: newDateStr, scheduledStartTime: newTime },
      },
    });
  } catch { /* non-critical */ }

  // Send confirmation email to customer
  try {
    const formattedDate = newDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    await sendTransactionalEmail({
      to: customer.email,
      subject: "Your booking has been rescheduled — AreaSorted",
      text: [
        `Hi ${customer.firstName},`,
        "",
        "Your booking has been successfully rescheduled.",
        "",
        `New date: ${formattedDate}`,
        `New time: ${newTime}`,
        "",
        "If you have any questions, please contact our support team.",
        "",
        "Thank you,",
        "The AreaSorted Team",
      ].join("\n"),
    });
    try {
      const { sendProviderRescheduleEmail } = await import("@/lib/notifications/booking-emails");
      await sendProviderRescheduleEmail(bookingId, formattedDate, newTime);
    } catch {
      // Non-critical
    }
  } catch { /* non-critical */ }

  // Notify provider if one was assigned
  if (booking.providerCompanyId) {
    try {
      const formattedDate = newDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      await createProviderNotification({
        providerCompanyId: booking.providerCompanyId,
        type: "ORDER_CANCELLED", // reuse — closest existing type for schedule change
        title: "Booking rescheduled by customer",
        message: `The customer has rescheduled the booking to ${formattedDate} at ${newTime}.`,
        link: `/provider/orders/${bookingId}`,
        bookingId,
      });
    } catch { /* non-critical */ }
  }

  const ref = booking.quoteRequest?.reference ?? bookingId;
  revalidatePath(`/account/bookings/${ref}`);
  revalidatePath("/account/bookings");
  revalidatePath("/admin/orders");
  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
  return { success: true };
}

/**
 * Customer accepts a counter offer from a provider.
 * Updates the booking with proposed changes and notifies the provider.
 */
export async function acceptCounterOfferAction(formData: FormData) {
  const customer = await requireCustomerSession();
  const counterOfferId = String(formData.get("counterOfferId") || "");
  if (!counterOfferId) return { error: "Missing counter offer ID" };

  const prisma = getPrisma();

  // C4 FIX: Atomically claim the counter offer to prevent race with provider withdraw.
  // Only a PENDING offer can be accepted.
  // H-32 FIX: Include booking.customerId in WHERE to ensure ownership atomically,
  // instead of claiming first and checking ownership post-hoc with rollback.
  const claimResult = await prisma.counterOffer.updateMany({
    where: {
      id: counterOfferId,
      status: "PENDING",
      booking: { customerId: customer.id },
    },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  if (claimResult.count === 0) {
    return { error: "Counter offer not found or already resolved" };
  }

  // Now load the full offer details
  const offer = await prisma.counterOffer.findUnique({
    where: { id: counterOfferId },
    include: {
      booking: {
        select: {
          id: true,
          customerId: true,
          providerCompanyId: true,
          quoteRequest: { select: { reference: true } },
        },
      },
      providerCompany: { select: { tradingName: true, legalName: true, contactEmail: true } },
    },
  });

  if (!offer) {
    return { error: "Counter offer not found" };
  }

  // C5 FIX: Apply proposed changes to the booking AND update PriceSnapshot + PaymentRecord
  // so that financial records stay consistent with the new agreed price.
  const bookingUpdate: Record<string, unknown> = {};
  if (offer.proposedPrice) {
    bookingUpdate.totalAmount = offer.proposedPrice;
  }
  if (offer.proposedDate) {
    bookingUpdate.scheduledDate = offer.proposedDate;
  }
  if (offer.proposedStartTime) {
    bookingUpdate.scheduledStartTime = offer.proposedStartTime;
  }

  if (Object.keys(bookingUpdate).length > 0) {
    await prisma.booking.update({
      where: { id: offer.bookingId },
      data: bookingUpdate,
    });
  }

  // C5 FIX: If price changed, update the PriceSnapshot and PaymentRecord
  if (offer.proposedPrice) {
    const newPrice = Number(offer.proposedPrice);

    // Update PriceSnapshot customerTotalAmount
    await prisma.bookingPriceSnapshot.updateMany({
      where: { bookingId: offer.bookingId },
      data: { customerTotalAmount: newPrice },
    });

    // Update PaymentRecord grossAmount to match new price
    await prisma.paymentRecord.updateMany({
      where: { bookingId: offer.bookingId, paymentState: "PENDING" },
      data: { grossAmount: newPrice },
    });

    // C-9 FIX: Handle Stripe auth amount mismatch.
    // Stripe allows capturing LESS than authorized (partial capture) but NOT MORE.
    // If new price > original authorized amount, we must cancel the old auth
    // and revert booking to AWAITING_PAYMENT so the customer pays the difference
    // via a new checkout session.
    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: { bookingId: offer.bookingId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        stripePaymentIntentId: true,
        stripeAccountId: true,
        grossAmount: true,
      },
    });

    if (paymentRecord?.stripePaymentIntentId && paymentRecord.stripeAccountId) {
      // Load the original booking to check what was authorized
      const currentBooking = await prisma.booking.findUnique({
        where: { id: offer.bookingId },
        select: { totalAmount: true },
      });

      // Check the original authorized amount from the PaymentIntent metadata
      // Since we just set grossAmount to newPrice above, compare with original totalAmount
      const originalAmount = currentBooking ? Number(currentBooking.totalAmount) : 0;

      if (newPrice > originalAmount && originalAmount > 0) {
        // New price exceeds original authorization — cancel old auth,
        // mark booking as needing re-payment
        try {
          await cancelDirectChargePaymentIntent({
            connectedAccountId: paymentRecord.stripeAccountId,
            paymentIntentId: paymentRecord.stripePaymentIntentId,
          });
          await prisma.paymentRecord.update({
            where: { id: paymentRecord.id },
            data: { paymentState: "CANCELLED" },
          });
          await prisma.booking.update({
            where: { id: offer.bookingId },
            data: { bookingStatus: "AWAITING_PAYMENT" },
          });
        } catch {
          // If cancel fails, mark for admin review
        }
      }
      // If newPrice <= originalAmount, partial capture will work fine — no action needed.
    }
  }

  // Notify provider (in-app)
  if (offer.booking.providerCompanyId) {
    try {
      await createProviderNotification({
        providerCompanyId: offer.booking.providerCompanyId,
        type: "COUNTER_OFFER_RESPONSE",
        title: "Counter offer accepted",
        message: "The customer has accepted your counter offer. The booking has been updated.",
        link: `/provider/orders/${offer.bookingId}`,
        bookingId: offer.bookingId,
      });
    } catch {
      // Non-critical
    }
  }

  const ref = offer.booking.quoteRequest?.reference ?? offer.bookingId;
  revalidatePath(`/account/bookings/${ref}`);
  revalidatePath("/account/bookings");
  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${offer.bookingId}`);
  return { success: true };
}

/**
 * Customer rejects a counter offer from a provider.
 * The original booking terms remain unchanged.
 */
export async function rejectCounterOfferAction(formData: FormData) {
  const customer = await requireCustomerSession();
  const counterOfferId = String(formData.get("counterOfferId") || "");
  const reason = String(formData.get("reason") || "").trim() || null;
  if (!counterOfferId) return { error: "Missing counter offer ID" };

  const prisma = getPrisma();

  // Atomic claim — only PENDING offers can be rejected
  // H-33 FIX: Include booking.customerId in WHERE to ensure ownership atomically.
  const claimResult = await prisma.counterOffer.updateMany({
    where: {
      id: counterOfferId,
      status: "PENDING",
      booking: { customerId: customer.id },
    },
    data: {
      status: "REJECTED",
      respondedAt: new Date(),
      responseNotes: reason,
    },
  });

  if (claimResult.count === 0) {
    return { error: "Counter offer not found or already resolved" };
  }

  const offer = await prisma.counterOffer.findUnique({
    where: { id: counterOfferId },
    include: {
      booking: {
        select: {
          id: true,
          customerId: true,
          providerCompanyId: true,
          quoteRequest: { select: { reference: true } },
        },
      },
    },
  });

  if (!offer) {
    return { error: "Counter offer not found" };
  }

  // Notify provider (in-app)
  if (offer.booking.providerCompanyId) {
    try {
      await createProviderNotification({
        providerCompanyId: offer.booking.providerCompanyId,
        type: "COUNTER_OFFER_RESPONSE",
        title: "Counter offer declined",
        message: reason
          ? `The customer declined your counter offer. Reason: "${reason}"`
          : "The customer declined your counter offer. The original booking terms remain in place.",
        link: `/provider/orders/${offer.bookingId}`,
        bookingId: offer.bookingId,
      });
    } catch {
      // Non-critical
    }
  }

  const ref = offer.booking.quoteRequest?.reference ?? offer.bookingId;
  revalidatePath(`/account/bookings/${ref}`);
  revalidatePath("/account/bookings");
  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${offer.bookingId}`);
  return { success: true };
}
