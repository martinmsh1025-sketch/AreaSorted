"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { rematchBookingAfterRejection } from "@/server/services/public/provider-matching";

/**
 * Provider accepts a booking — moves status to ASSIGNED.
 */
export async function acceptBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;

  const prisma = getPrisma();

  // Verify the booking belongs to this provider and is in an acceptable state
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: { in: ["PAID", "PENDING_ASSIGNMENT"] },
    },
  });

  if (!booking) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: "ASSIGNED" },
  });

  // Notify customer
  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "ASSIGNED");
  } catch { /* non-critical */ }

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
}

/**
 * Provider rejects a booking — clears provider link, then attempts
 * automatic re-matching to another provider. Falls back to NO_CLEANER_FOUND
 * if no alternatives are available.
 */
export async function rejectBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!bookingId) return;

  const prisma = getPrisma();

  // Verify the booking belongs to this provider and is in a rejectable state
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: { in: ["PAID", "PENDING_ASSIGNMENT"] },
    },
    include: { quoteRequest: true },
  });

  if (!booking) return;

  // Unlink provider and record rejection reason
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      providerCompanyId: null,
      cancelledByType: "PROVIDER",
      cancelledReason: reason || "Provider declined the booking",
    },
  });

  // Attempt to find another provider (excluding the one that just rejected)
  const categoryKey = booking.quoteRequest?.categoryKey;
  const postcode = booking.servicePostcode;

  if (categoryKey && postcode) {
    const rematch = await rematchBookingAfterRejection({
      bookingId,
      postcode,
      categoryKey,
      excludeProviderIds: [session.providerCompany.id],
    });

    if (rematch.status === "reassigned") {
      revalidatePath("/provider/orders");
      revalidatePath(`/provider/orders/${bookingId}`);
      return;
    }
  }

  // No alternative found — mark as NO_CLEANER_FOUND
  await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: "NO_CLEANER_FOUND" },
  });

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
}

/**
 * Provider marks a booking as in-progress.
 */
export async function startBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;

  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: "ASSIGNED",
    },
  });

  if (!booking) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: "IN_PROGRESS" },
  });

  // Notify customer
  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "IN_PROGRESS");
  } catch { /* non-critical */ }

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
}

/**
 * Provider marks a booking as completed.
 */
export async function completeBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;

  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: "IN_PROGRESS",
    },
  });

  if (!booking) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: "COMPLETED" },
  });

  // Notify customer
  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "COMPLETED");
  } catch { /* non-critical */ }

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
}
