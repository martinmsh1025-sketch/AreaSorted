"use server";

import { revalidatePath } from "next/cache";
import { updateBookingStatuses } from "@/lib/booking-record-store";

export async function updateBookingStatusAction(formData: FormData) {
  const bookingReference = String(formData.get("bookingReference") || "");

  if (!bookingReference) return;

  await updateBookingStatuses(bookingReference, {
    cleanerId: String(formData.get("cleanerId") || ""),
    cleanerName: String(formData.get("cleanerName") || ""),
    cleanerEmail: String(formData.get("cleanerEmail") || ""),
    cleanerPayoutAmount: Number(formData.get("cleanerPayoutAmount") || 0),
    platformEarningsAmount: Number(formData.get("platformEarningsAmount") || 0),
    stripePaymentStatus: String(formData.get("stripePaymentStatus") || "pending") as
      | "pending"
      | "paid"
      | "cancelled"
      | "failed",
    assignmentStatus: String(formData.get("assignmentStatus") || "unassigned") as
      | "unassigned"
      | "offering"
      | "assigned"
      | "accepted"
      | "reassigned",
    jobStatus: String(formData.get("jobStatus") || "pending") as
      | "pending"
      | "scheduled"
      | "in_progress"
      | "completed"
      | "no_show"
      | "cancelled",
    refundStatus: String(formData.get("refundStatus") || "not_requested") as
      | "not_requested"
      | "pending"
      | "refunded"
      | "partial_refund"
      | "declined",
  });

  revalidatePath(`/admin/bookings/${bookingReference}`);
  revalidatePath("/admin/bookings");
}
