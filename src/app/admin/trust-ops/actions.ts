"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import type { ComplaintStatus, DisputeCaseStatus } from "@prisma/client";
import { ensurePayoutRecordForBooking } from "@/lib/payouts";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { createProviderNotification } from "@/lib/providers/notifications";

const COMPLAINT_STATUSES: ComplaintStatus[] = ["OPEN", "UNDER_REVIEW", "UPHELD", "REJECTED", "RESOLVED"];
const DISPUTE_STATUSES: DisputeCaseStatus[] = ["OPEN", "NEEDS_EVIDENCE", "SUBMITTED", "WON", "LOST", "CLOSED"];

const COMPLAINT_OUTCOME_PRESETS = {
  REVIEW_ONLY: { status: "UNDER_REVIEW" as ComplaintStatus, note: "Case moved into review. Request any missing timeline or evidence before deciding on payout impact." },
  MINOR_CREDIT: { status: "UPHELD" as ComplaintStatus, note: "Minor upheld issue. Recommended provider deduction: up to 15% of provider payout, capped at GBP 25." },
  PARTIAL_REFUND: { status: "UPHELD" as ComplaintStatus, note: "Moderate upheld issue. Recommended provider deduction: up to 50% of provider payout, capped by the direct customer remedy cost." },
  FULL_REFUND: { status: "UPHELD" as ComplaintStatus, note: "Severe upheld issue. Recommended outcome: full or near-full customer refund and provider deduction up to 100% where justified." },
  NO_SHOW_PROVIDER: { status: "UPHELD" as ComplaintStatus, note: "Provider no-show. Recommended outcome: full refund or replacement booking and provider deduction up to 100%." },
  DAMAGE_ESCALATION: { status: "UNDER_REVIEW" as ComplaintStatus, note: "Damage or safety issue. Hold payout and escalate for evidence review before final decision." },
  REJECT_COMPLAINT: { status: "REJECTED" as ComplaintStatus, note: "Complaint not upheld on current evidence." },
  RESOLVED_NO_PAYOUT_IMPACT: { status: "RESOLVED" as ComplaintStatus, note: "Resolved without provider payout deduction." },
} as const;

export async function markSupportEnquiryReadAction(formData: FormData) {
  await requireAdminSession();
  const enquiryId = String(formData.get("enquiryId") || "").trim();
  const read = String(formData.get("read") || "true") === "true";
  if (!enquiryId) return;
  const prisma = getPrisma();
  await prisma.contactEnquiry.update({ where: { id: enquiryId }, data: { read } });
  revalidatePath("/admin/trust-ops");
}

export async function updateComplaintStatusAction(formData: FormData) {
  const admin = await requireAdminSession();
  const complaintId = String(formData.get("complaintId") || "").trim();
  const statusInput = String(formData.get("status") || "").trim() as ComplaintStatus;
  const outcomePreset = String(formData.get("outcomePreset") || "").trim() as keyof typeof COMPLAINT_OUTCOME_PRESETS | "";
  const resolutionNotes = String(formData.get("resolutionNotes") || "").trim();
  const preset = outcomePreset ? COMPLAINT_OUTCOME_PRESETS[outcomePreset] : null;
  const status = preset?.status ?? statusInput;
  if (!complaintId || !COMPLAINT_STATUSES.includes(status)) return;
  const prisma = getPrisma();
  const complaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status,
      reviewedByAdminId: admin.id,
      reviewedAt: new Date(),
      resolutionNotes: resolutionNotes || preset?.note || undefined,
    },
  });

  const complaintContext = await prisma.complaint.findUnique({
    where: { id: complaint.id },
    include: {
      customer: { select: { email: true, firstName: true } },
      booking: {
        select: {
          id: true,
          servicePostcode: true,
          providerCompanyId: true,
          marketplaceProviderCompany: { select: { contactEmail: true, tradingName: true, legalName: true } },
        },
      },
    },
  });

  const payout = await ensurePayoutRecordForBooking(complaint.bookingId, prisma);

  if (payout && ["MINOR_CREDIT", "PARTIAL_REFUND", "FULL_REFUND", "NO_SHOW_PROVIDER", "DAMAGE_ESCALATION"].includes(outcomePreset)) {
    await prisma.payoutRecord.update({
      where: { id: payout.id },
      data: {
        status: "BLOCKED",
        blockedAt: new Date(),
        blockedReason: resolutionNotes || preset?.note || "Complaint review requires payout hold.",
      },
    });
  }

  if (["PARTIAL_REFUND", "FULL_REFUND", "NO_SHOW_PROVIDER"].includes(outcomePreset)) {
    const booking = await prisma.booking.findUnique({
      where: { id: complaint.bookingId },
      select: { totalAmount: true, paymentRecords: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } } },
    });

    const paymentRecordId = booking?.paymentRecords[0]?.id;
    if (booking && paymentRecordId) {
      const existingPendingRefund = await prisma.refundRecord.findFirst({
        where: { bookingId: complaint.bookingId, status: "PENDING" },
        select: { id: true },
      });

      if (!existingPendingRefund) {
        const amount = outcomePreset === "PARTIAL_REFUND"
          ? Number(booking.totalAmount) * 0.5
          : Number(booking.totalAmount);

        await prisma.refundRecord.create({
          data: {
            bookingId: complaint.bookingId,
            paymentRecordId,
            amount,
            status: "PENDING",
            actorId: admin.id,
            refundReason: resolutionNotes || preset?.note || "Complaint outcome pending refund review.",
            liability: "PROVIDER",
          },
        });
      }
    }
  }

  revalidatePath("/admin/trust-ops");
  revalidatePath(`/admin/orders/${complaint.bookingId}`);
  revalidatePath("/admin/payouts");
  revalidatePath("/admin/refunds");
  revalidatePath(`/account/bookings/${complaint.bookingId}`);
  revalidatePath("/account/cases");
  revalidatePath(`/provider/orders/${complaint.bookingId}`);

  const statusLabel = status.replace(/_/g, " ").toLowerCase();
  if (complaintContext?.customer?.email) {
    await sendTransactionalEmail({
      to: complaintContext.customer.email,
      subject: `AreaSorted case update for ${complaintContext.booking.servicePostcode}`,
      text: [
        `Hi ${complaintContext.customer.firstName || "there"},`,
        "",
        `Your booking issue is now marked as: ${statusLabel}.`,
        resolutionNotes || preset?.note || "Please sign in to your AreaSorted account to review the latest case details.",
      ].join("\n"),
    }).catch(() => undefined);
  }

  if (complaintContext?.booking.providerCompanyId) {
    await createProviderNotification({
      providerCompanyId: complaintContext.booking.providerCompanyId,
      type: "SYSTEM_MESSAGE",
      title: `Booking case ${statusLabel}`,
      message: resolutionNotes || preset?.note || "A booking complaint was updated. Review the order page for the latest case status.",
      bookingId: complaintContext.booking.id,
      link: `/provider/orders/${complaintContext.booking.id}`,
    }).catch(() => undefined);

    if (complaintContext.booking.marketplaceProviderCompany?.contactEmail) {
      await sendTransactionalEmail({
        to: complaintContext.booking.marketplaceProviderCompany.contactEmail,
        subject: `AreaSorted provider case update for ${complaintContext.booking.servicePostcode}`,
        text: [
          `Hi ${complaintContext.booking.marketplaceProviderCompany.tradingName || complaintContext.booking.marketplaceProviderCompany.legalName || "provider"},`,
          "",
          `A booking complaint is now marked as: ${statusLabel}.`,
          resolutionNotes || preset?.note || "Please review the booking in your provider portal for the latest update.",
        ].join("\n"),
      }).catch(() => undefined);
    }
  }
}

export async function updateDisputeStatusAction(formData: FormData) {
  await requireAdminSession();
  const disputeId = String(formData.get("disputeId") || "").trim();
  const status = String(formData.get("status") || "").trim() as DisputeCaseStatus;
  if (!disputeId || !DISPUTE_STATUSES.includes(status)) return;
  const prisma = getPrisma();
  await prisma.disputeRecord.update({ where: { id: disputeId }, data: { status } });
  revalidatePath("/admin/trust-ops");
}
