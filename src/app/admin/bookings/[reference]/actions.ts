"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createProviderNotification } from "@/lib/providers/notifications";

export async function updateBookingStatusAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const bookingId = String(formData.get("bookingId") || "");

  if (!bookingId) return;

  const prisma = getPrisma();

  const bookingStatus = String(formData.get("bookingStatus") || "AWAITING_PAYMENT");
  const cleanerPayoutAmount = Number(formData.get("cleanerPayoutAmount") || 0);
  const platformMarginAmount = Number(formData.get("platformMarginAmount") || 0);

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: bookingStatus as any,
      cleanerPayoutAmount,
      platformMarginAmount,
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
}

/**
 * Admin accepts a counter offer — updates booking price/schedule and notifies provider.
 */
export async function acceptCounterOfferAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const counterOfferId = String(formData.get("counterOfferId") || "");
  const adminNotes = String(formData.get("adminNotes") || "").trim() || null;
  if (!counterOfferId) return;

  const prisma = getPrisma();

  const offer = await prisma.counterOffer.findUnique({
    where: { id: counterOfferId },
    include: { booking: { select: { id: true, providerCompanyId: true } } },
  });

  if (!offer || offer.status !== "PENDING") return;

  // Update counter offer status
  await prisma.counterOffer.update({
    where: { id: counterOfferId },
    data: { status: "ACCEPTED", respondedAt: new Date(), adminNotes },
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

  // Notify provider
  if (offer.booking.providerCompanyId) {
    try {
      await createProviderNotification({
        providerCompanyId: offer.booking.providerCompanyId,
        type: "COUNTER_OFFER_RESPONSE",
        title: "Counter offer accepted",
        message: adminNotes
          ? `Your counter offer has been accepted. ${adminNotes}`
          : "Your counter offer has been accepted! The booking has been updated.",
        link: `/provider/orders/${offer.bookingId}`,
        bookingId: offer.bookingId,
      });
    } catch {
      // Non-critical
    }
  }

  revalidatePath(`/admin/bookings`);
}

/**
 * Admin rejects a counter offer.
 */
export async function rejectCounterOfferAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const counterOfferId = String(formData.get("counterOfferId") || "");
  const adminNotes = String(formData.get("adminNotes") || "").trim() || null;
  if (!counterOfferId) return;

  const prisma = getPrisma();

  const offer = await prisma.counterOffer.findUnique({
    where: { id: counterOfferId },
    include: { booking: { select: { id: true, providerCompanyId: true } } },
  });

  if (!offer || offer.status !== "PENDING") return;

  await prisma.counterOffer.update({
    where: { id: counterOfferId },
    data: { status: "REJECTED", respondedAt: new Date(), adminNotes },
  });

  // Notify provider
  if (offer.booking.providerCompanyId) {
    try {
      await createProviderNotification({
        providerCompanyId: offer.booking.providerCompanyId,
        type: "COUNTER_OFFER_RESPONSE",
        title: "Counter offer declined",
        message: adminNotes
          ? `Your counter offer was declined. ${adminNotes}`
          : "Your counter offer was declined. You can accept the original booking or submit a new offer.",
        link: `/provider/orders/${offer.bookingId}`,
        bookingId: offer.bookingId,
      });
    } catch {
      // Non-critical
    }
  }

  revalidatePath(`/admin/bookings`);
}
