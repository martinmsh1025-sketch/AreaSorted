"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { BookingStatus } from "@prisma/client";

// C-10 FIX: Whitelist of valid BookingStatus values — prevents arbitrary string injection
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

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: bookingStatus as BookingStatus,
      cleanerPayoutAmount,
      platformMarginAmount,
    },
  });

  revalidatePath(`/admin/orders/${bookingId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
}

// Counter offers are now handled directly between providers and customers.
// Admin has read-only visibility — no accept/reject actions needed.
