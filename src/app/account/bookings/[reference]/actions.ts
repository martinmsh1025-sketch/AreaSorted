"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { requireCustomerSession } from "@/lib/customer-auth";
import { createProviderNotification } from "@/lib/providers/notifications";
import { sendTransactionalEmail } from "@/lib/notifications/email";

/** Statuses from which a customer can self-cancel */
const CANCELLABLE_STATUSES = ["PAID", "PENDING_ASSIGNMENT", "ASSIGNED"];

/** Statuses from which a customer can self-reschedule */
const RESCHEDULABLE_STATUSES = ["PAID", "PENDING_ASSIGNMENT", "ASSIGNED"];

/**
 * Customer cancels their own booking.
 */
export async function cancelBookingAction(formData: FormData) {
  const customer = await requireCustomerSession();
  const bookingId = String(formData.get("bookingId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!bookingId) return { error: "Missing booking ID" };

  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      customerId: customer.id,
      bookingStatus: { in: CANCELLABLE_STATUSES as any },
    },
    include: {
      quoteRequest: { select: { reference: true } },
    },
  });

  if (!booking) return { error: "Booking not found or cannot be cancelled" };

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: "CANCELLED",
      cancelledByType: "CUSTOMER",
      cancelledReason: reason || "Cancelled by customer",
    },
  });

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

  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(newTime)) return { error: "Invalid time format" };

  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      customerId: customer.id,
      bookingStatus: { in: RESCHEDULABLE_STATUSES as any },
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

  if (!offer || offer.status !== "PENDING") {
    return { error: "Counter offer not found or already resolved" };
  }

  // Verify this booking belongs to the current customer
  if (offer.booking.customerId !== customer.id) {
    return { error: "Unauthorized" };
  }

  // Update counter offer status
  await prisma.counterOffer.update({
    where: { id: counterOfferId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  // Apply proposed changes to the booking
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

  if (!offer || offer.status !== "PENDING") {
    return { error: "Counter offer not found or already resolved" };
  }

  // Verify this booking belongs to the current customer
  if (offer.booking.customerId !== customer.id) {
    return { error: "Unauthorized" };
  }

  await prisma.counterOffer.update({
    where: { id: counterOfferId },
    data: {
      status: "REJECTED",
      respondedAt: new Date(),
      responseNotes: reason,
    },
  });

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
