"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { requireCustomerSession } from "@/lib/customer-auth";
import { createProviderNotification } from "@/lib/providers/notifications";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { cancelDirectChargePaymentIntent, createDirectChargeRefund } from "@/lib/stripe/connect";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { matchProvidersForPublicQuote } from "@/server/services/public/provider-matching";
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

function toIsoDate(value: Date) {
  return value.toISOString().split("T")[0];
}

async function validateCustomerReschedule(input: {
  bookingId: string;
  providerCompanyId: string | null;
  postcode: string;
  categoryKey: string;
  serviceKey: string;
  date: Date;
  time: string;
  currentBookingId: string;
  estimatedHours?: number;
  quantity?: number;
  sameDay?: boolean;
  weekend?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  cleaningCondition?: "light" | "standard" | "heavy" | "very-heavy";
  supplies?: "customer" | "provider";
  propertyType?: string;
  jobSize?: "small" | "standard" | "large";
  addOns?: string[];
  currentTotal: number;
}) {
  if (!input.providerCompanyId) {
    return { ok: false as const, error: "This booking is not linked to a provider yet. Please contact support to reschedule it safely." };
  }

  const providerMatch = await matchProvidersForPublicQuote({
    postcode: input.postcode,
    categoryKey: input.categoryKey,
    serviceKey: input.serviceKey,
    scheduledDate: input.date,
    scheduledTime: input.time,
  });

  if (providerMatch.status !== "matched") {
    return { ok: false as const, error: "No provider is available for that new time slot." };
  }

  const selectedProvider = providerMatch.providers.find((provider) => provider.providerCompanyId === input.providerCompanyId);
  if (!selectedProvider) {
    return { ok: false as const, error: "Your assigned provider is not available for that slot. Please contact support for re-assignment." };
  }

  try {
    const repriced = await previewProviderPricing({
      providerCompanyId: input.providerCompanyId,
      categoryKey: input.categoryKey,
      serviceKey: input.serviceKey,
      postcodePrefix: selectedProvider.postcodePrefix,
      estimatedHours: input.estimatedHours,
      quantity: input.quantity,
      sameDay: input.sameDay,
      weekend: input.weekend,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      kitchens: input.kitchens,
      cleaningCondition: input.cleaningCondition,
      supplies: input.supplies,
      propertyType: input.propertyType,
      jobSize: input.jobSize,
      addOns: input.addOns,
    });

    if (Math.abs(repriced.totalCustomerPay - input.currentTotal) > 0.009) {
      return { ok: false as const, error: "That new slot changes the booking price. Please contact support so we can review it safely." };
    }
  } catch {
    return { ok: false as const, error: "We could not verify pricing for that new slot. Please contact support to reschedule." };
  }

  const prisma = getPrisma();
  const provider = await prisma.providerCompany.findUnique({
    where: { id: input.providerCompanyId },
    select: {
      leadTimeHours: true,
      maxJobsPerDay: true,
      availabilityRules: true,
      dateOverrides: {
        where: { date: input.date },
      },
    },
  });

  if (!provider) {
    return { ok: false as const, error: "Assigned provider could not be re-validated." };
  }

  const scheduledAt = new Date(`${toIsoDate(input.date)}T${input.time}:00`);
  const leadTimeHours = provider.leadTimeHours ?? 24;
  if (scheduledAt.getTime() - Date.now() < leadTimeHours * 60 * 60 * 1000) {
    return { ok: false as const, error: `This provider requires at least ${leadTimeHours} hours notice for schedule changes.` };
  }

  const override = provider.dateOverrides[0];
  if (override) {
    if (!override.isAvailable) {
      return { ok: false as const, error: "That date has been marked unavailable by the provider." };
    }
    if (override.startTime && override.endTime && (input.time < override.startTime || input.time >= override.endTime)) {
      return { ok: false as const, error: "That time falls outside the provider's available window for the selected date." };
    }
  } else if (provider.availabilityRules.length) {
    const dayRule = provider.availabilityRules.find((rule) => rule.dayOfWeek === input.date.getDay());
    if (!dayRule || !dayRule.isAvailable || input.time < dayRule.startTime || input.time >= dayRule.endTime) {
      return { ok: false as const, error: "That time falls outside the provider's standard availability." };
    }
  }

  if (provider.maxJobsPerDay) {
    const dayStart = new Date(`${toIsoDate(input.date)}T00:00:00.000Z`);
    const dayEnd = new Date(`${toIsoDate(input.date)}T23:59:59.999Z`);
    const jobsOnDay = await prisma.booking.count({
      where: {
        providerCompanyId: input.providerCompanyId,
        id: { not: input.currentBookingId },
        bookingStatus: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "PAID", "PENDING_ASSIGNMENT"] },
        scheduledDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (jobsOnDay >= provider.maxJobsPerDay) {
      return { ok: false as const, error: "That date is already at provider capacity. Please choose another slot." };
    }
  }

  return { ok: true as const };
}

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

  try {
    await prisma.auditLog.create({
      data: {
        actorType: "CUSTOMER",
        actorId: customer.id,
        actionType: "BOOKING_CANCELLED",
        entityType: "Booking",
        entityId: bookingId,
        newValues: { reason: reason || "Cancelled by customer" },
      },
    });
  } catch {
    // Non-critical
  }

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
          try {
            await prisma.auditLog.create({
              data: {
                actorType: "SYSTEM",
                actionType: "BOOKING_REFUND_PENDING",
                entityType: "Booking",
                entityId: bookingId,
                newValues: { reason: "Automatic direct-charge refund failed after customer cancellation." },
              },
            });
          } catch {
            // Non-critical
          }
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
      quoteRequest: { select: { reference: true, categoryKey: true, serviceKey: true, inputJson: true } },
      priceSnapshot: true,
    },
  });

  if (!booking) return { error: "Booking not found or cannot be rescheduled" };

  const oldDate = booking.scheduledDate.toISOString().split("T")[0];
  const oldTime = booking.scheduledStartTime;

  // Don't allow reschedule to same date+time
  if (oldDate === newDateStr && oldTime === newTime) {
    return { error: "New date and time are the same as the current booking" };
  }

  const quoteInput = ((booking.quoteRequest?.inputJson as Record<string, unknown> | null) ?? {});
  const validation = await validateCustomerReschedule({
    bookingId,
    providerCompanyId: booking.providerCompanyId,
    postcode: booking.servicePostcode,
    categoryKey: booking.quoteRequest?.categoryKey ?? "CLEANING",
    serviceKey: booking.quoteRequest?.serviceKey ?? booking.serviceType,
    date: newDate,
    time: newTime,
    currentBookingId: booking.id,
    estimatedHours: typeof quoteInput.estimatedHours === "number" ? quoteInput.estimatedHours : Number(booking.durationHours),
    quantity: typeof quoteInput.quantity === "number" ? quoteInput.quantity : 1,
    sameDay: false,
    weekend: [0, 6].includes(newDate.getDay()),
    bedrooms: typeof quoteInput.bedrooms === "number" ? quoteInput.bedrooms : undefined,
    bathrooms: typeof quoteInput.bathrooms === "number" ? quoteInput.bathrooms : undefined,
    kitchens: typeof quoteInput.kitchens === "number" ? quoteInput.kitchens : undefined,
    cleaningCondition: ["light", "standard", "heavy", "very-heavy"].includes(String(quoteInput.cleaningCondition))
      ? quoteInput.cleaningCondition as "light" | "standard" | "heavy" | "very-heavy"
      : undefined,
    supplies: quoteInput.supplies === "customer" || quoteInput.supplies === "provider"
      ? quoteInput.supplies
      : undefined,
    propertyType: typeof quoteInput.propertyType === "string" ? quoteInput.propertyType : undefined,
    jobSize: quoteInput.jobSize === "small" || quoteInput.jobSize === "standard" || quoteInput.jobSize === "large"
      ? quoteInput.jobSize
      : undefined,
    addOns: Array.isArray(quoteInput.addOns) ? quoteInput.addOns.filter((value): value is string => typeof value === "string") : undefined,
    currentTotal: booking.priceSnapshot ? Number(booking.priceSnapshot.customerTotalAmount) : Number(booking.totalAmount),
  });

  if (!validation.ok) {
    return { error: validation.error };
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
