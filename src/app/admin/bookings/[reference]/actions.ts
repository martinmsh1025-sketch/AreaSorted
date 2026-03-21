"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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

// Counter offers are now handled directly between providers and customers.
// Admin has read-only visibility — no accept/reject actions needed.
