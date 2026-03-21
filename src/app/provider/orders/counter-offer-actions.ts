"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { createProviderNotification } from "@/lib/providers/notifications";

/**
 * Provider submits a counter offer on a booking.
 * Only allowed when booking is PAID or PENDING_ASSIGNMENT.
 */
export async function createCounterOfferAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  const proposedPriceStr = String(formData.get("proposedPrice") || "").trim();
  const proposedDateStr = String(formData.get("proposedDate") || "").trim();
  const proposedStartTime = String(formData.get("proposedStartTime") || "").trim() || null;
  const message = String(formData.get("message") || "").trim() || null;

  if (!bookingId) return { error: "Missing booking ID" };

  const proposedPrice = proposedPriceStr ? parseFloat(proposedPriceStr) : null;
  const proposedDate = proposedDateStr ? new Date(proposedDateStr) : null;

  if (proposedPrice === null && proposedDate === null) {
    return { error: "Please propose a different price or date" };
  }

  if (proposedPrice !== null && (isNaN(proposedPrice) || proposedPrice <= 0)) {
    return { error: "Invalid price" };
  }

  const prisma = getPrisma();

  // Verify booking belongs to this provider and is in acceptable state
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: { in: ["PAID", "PENDING_ASSIGNMENT"] },
    },
  });

  if (!booking) return { error: "Booking not found or not eligible for counter offer" };

  // Check no pending counter offer already exists
  const existing = await prisma.counterOffer.findFirst({
    where: {
      bookingId,
      providerCompanyId: session.providerCompany.id,
      status: "PENDING",
    },
  });

  if (existing) return { error: "You already have a pending counter offer for this booking" };

  await prisma.counterOffer.create({
    data: {
      bookingId,
      providerCompanyId: session.providerCompany.id,
      proposedPrice,
      proposedDate,
      proposedStartTime: proposedStartTime || null,
      message,
    },
  });

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
  return { success: true };
}

/**
 * Provider withdraws their pending counter offer.
 */
export async function withdrawCounterOfferAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const counterOfferId = String(formData.get("counterOfferId") || "");
  if (!counterOfferId) return { error: "Missing counter offer ID" };

  const prisma = getPrisma();

  const offer = await prisma.counterOffer.findFirst({
    where: {
      id: counterOfferId,
      providerCompanyId: session.providerCompany.id,
      status: "PENDING",
    },
  });

  if (!offer) return { error: "Counter offer not found or already resolved" };

  await prisma.counterOffer.update({
    where: { id: counterOfferId },
    data: { status: "WITHDRAWN", respondedAt: new Date() },
  });

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${offer.bookingId}`);
  return { success: true };
}
