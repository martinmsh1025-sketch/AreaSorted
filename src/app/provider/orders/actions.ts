"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { createProviderNotification } from "@/lib/providers/notifications";
import { cancelDirectChargePaymentIntent, captureDirectChargePaymentIntent } from "@/lib/stripe/connect";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { ensurePayoutRecordForBooking, refreshPayoutRecordState } from "@/lib/payouts";
import { saveProviderCaseEvidenceUploads } from "@/server/services/providers/case-evidence";
import { appendAttachmentPathsToSupportMessage } from "@/lib/support/attachments";
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
  redirect(`/provider/orders/${result.bookingId}?supportStatus=${encodeURIComponent(`${result.requestLabel} sent to support. Case ${result.caseReference}.`)}`);
}

export async function respondToComplaintAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  const complaintId = String(formData.get("complaintId") || "");
  const message = String(formData.get("message") || "").trim();
  const evidenceFiles = formData
    .getAll("evidence")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!bookingId || !complaintId) {
    redirect("/provider/orders?error=missing_case");
  }

  if (message.length < 20) {
    redirect(`/provider/orders/${bookingId}?supportError=${encodeURIComponent("Please add a fuller response so the case team can review it.")}`);
  }

  const prisma = getPrisma();
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      bookingId,
      booking: { providerCompanyId: session.providerCompany.id },
    },
    include: {
      booking: {
        select: {
          id: true,
          servicePostcode: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!complaint) {
    redirect(`/provider/orders/${bookingId}?supportError=${encodeURIComponent("This case is not available for your account.")}`);
  }

  const attachmentPaths = evidenceFiles.length > 0
    ? await saveProviderCaseEvidenceUploads(session.providerCompany.id, complaint.id, evidenceFiles)
    : [];

  await prisma.contactEnquiry.create({
    data: {
      name: session.providerCompany.tradingName || session.providerCompany.legalName || session.providerCompany.contactEmail,
      email: session.providerCompany.contactEmail.toLowerCase(),
      message: appendAttachmentPathsToSupportMessage([
        "[Provider complaint response]",
        `Complaint ID: ${complaint.id}`,
        `Booking ID: ${complaint.booking.id}`,
        `Booking postcode: ${complaint.booking.servicePostcode}`,
        `Customer: ${complaint.booking.customer?.firstName || ""} ${complaint.booking.customer?.lastName || ""}`.trim(),
        `Complaint status: ${complaint.status}`,
        `Complaint type: ${complaint.complaintType}`,
        "",
        message,
      ].join("\n"), attachmentPaths),
    },
  });

  await sendTransactionalEmail({
    to: process.env.SUPPORT_EMAIL || "support@areasorted.com",
    subject: `Provider complaint response for ${complaint.booking.servicePostcode}`,
    text: [
      `Complaint ID: ${complaint.id}`,
      `Booking ID: ${complaint.booking.id}`,
      `Provider: ${session.providerCompany.tradingName || session.providerCompany.legalName || session.providerCompany.contactEmail}`,
      "",
      message,
    ].join("\n"),
  }).catch(() => undefined);

  await createProviderNotification({
    providerCompanyId: session.providerCompany.id,
    type: "SYSTEM_MESSAGE",
    title: "Case response sent",
    message: "Your response has been sent to the AreaSorted case team for review.",
    bookingId,
    link: `/provider/orders/${bookingId}`,
  }).catch(() => undefined);

  revalidatePath(`/provider/orders/${bookingId}`);
  revalidatePath("/admin/trust-ops");
  redirect(`/provider/orders/${bookingId}?supportStatus=${encodeURIComponent("Your case response has been sent to support.")}`);
}
