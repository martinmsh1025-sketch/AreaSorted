"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { createProviderNotification } from "@/lib/providers/notifications";
import { cancelDirectChargePaymentIntent, captureDirectChargePaymentIntent } from "@/lib/stripe/connect";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { ensurePayoutRecordForBooking, refreshPayoutRecordState } from "@/lib/payouts";
import {
  acceptProviderBooking,
  completeProviderBooking,
  rejectProviderBooking,
  requestProviderOrderSupport,
  startProviderBooking,
} from "@/server/services/providers/orders";

/**
 * Provider accepts a booking — captures authorised funds and moves status to ASSIGNED.
 */
export async function acceptBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;
  const result = await acceptProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId });
  if (!result.ok) {
    redirect(`/provider/orders/${bookingId}?error=${encodeURIComponent("This booking is no longer available to accept.")}`);
  }

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
  revalidatePath("/account/bookings");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${bookingId}`);
}

/**
 * Provider rejects a booking — releases the authorisation and closes the booking.
 */
export async function rejectBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!bookingId) return;
  const result = await rejectProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId, reason });
  if (!result.ok) {
    redirect(`/provider/orders/${bookingId}?error=${encodeURIComponent("This booking is no longer available to decline.")}`);
  }

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
  revalidatePath("/account/bookings");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${bookingId}`);
}

/**
 * Provider marks a booking as in-progress.
 */
export async function startBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;
  const result = await startProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId });
  if (!result.ok) {
    redirect(`/provider/orders/${bookingId}?error=${encodeURIComponent("This booking cannot be started in its current state.")}`);
  }

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
  revalidatePath("/account/bookings");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${bookingId}`);
}

/**
 * Provider marks a booking as completed.
 */
export async function completeBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;
  const result = await completeProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId });
  if (!result.ok) {
    redirect(`/provider/orders/${bookingId}?error=${encodeURIComponent("This booking cannot be completed in its current state.")}`);
  }

  revalidatePath("/provider/orders");
  revalidatePath(`/provider/orders/${bookingId}`);
  revalidatePath("/account/bookings");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${bookingId}`);
}

export async function requestOrderSupportAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  const requestType = String(formData.get("requestType") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!bookingId) {
    redirect("/provider/orders?error=missing_booking");
  }

  if (!["RESCHEDULE", "CANCEL", "ISSUE"].includes(requestType)) {
    redirect(`/provider/orders/${bookingId}?supportError=invalid_request_type`);
  }

  if (message.length < 10) {
    redirect(`/provider/orders/${bookingId}?supportError=Please add a short explanation so support can help.`);
  }

  const result = await requestProviderOrderSupport({
    providerCompanyId: session.providerCompany.id,
    providerName: session.providerCompany.tradingName || session.providerCompany.legalName || session.providerCompany.contactEmail,
    providerEmail: session.providerCompany.contactEmail,
    bookingId,
    requestType: requestType as "RESCHEDULE" | "CANCEL" | "ISSUE",
    message,
  });

  if (!result.ok) {
    redirect(`/provider/orders/${bookingId}?supportError=This request is only available for accepted or in-progress orders.`);
  }

  revalidatePath(`/provider/orders/${result.bookingId}`);
  revalidatePath("/provider/notifications");
  redirect(`/provider/orders/${result.bookingId}?supportStatus=${encodeURIComponent(`${result.requestLabel} sent to support.`)}`);
}
