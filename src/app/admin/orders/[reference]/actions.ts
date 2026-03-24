"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { isAdminAuthenticated, requireAdminSession } from "@/lib/admin-auth";
import { captureDirectChargePaymentIntent, cancelDirectChargePaymentIntent, createDirectChargeRefund } from "@/lib/stripe/connect";
import type { BookingStatus } from "@prisma/client";
import { ensurePayoutRecordForBooking, refreshPayoutRecordState } from "@/lib/payouts";
import { verifyPassword } from "@/lib/security/password";

// C-10 FIX: Whitelist of valid BookingStatus values
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

  // H-28 FIX: Guard financial status transitions — perform corresponding Stripe
  // operations when admin sets statuses that have financial implications.
  const currentBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      bookingStatus: true,
      paymentRecords: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: {
          stripePaymentIntentId: true,
          stripeAccountId: true,
          paymentState: true,
        },
      },
      marketplaceProviderCompany: {
        select: { stripeConnectedAccount: { select: { stripeAccountId: true } } },
      },
    },
  });

  if (!currentBooking) throw new Error("Booking not found");

  const pr = currentBooking.paymentRecords[0];
  const stripeAccountId = pr?.stripeAccountId
    || currentBooking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  if (pr?.stripePaymentIntentId && stripeAccountId) {
    // Transitioning TO CANCELLED: cancel auth or refund captured payment
    if (bookingStatus === "CANCELLED" && currentBooking.bookingStatus !== "CANCELLED") {
      if (pr.paymentState === "PENDING") {
        try {
          await cancelDirectChargePaymentIntent({
            connectedAccountId: stripeAccountId,
            paymentIntentId: pr.stripePaymentIntentId,
          });
          await prisma.paymentRecord.updateMany({
            where: { bookingId },
            data: { paymentState: "CANCELLED" },
          });
          await prisma.payoutRecord.updateMany({
            where: { bookingId },
            data: { status: "CANCELLED", blockedReason: "Payment was cancelled before payout release." },
          });
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[H-28] Failed to cancel PI for booking ${bookingId}`);
          }
        }
      } else if (pr.paymentState === "PAID") {
        try {
          await createDirectChargeRefund({
            connectedAccountId: stripeAccountId,
            paymentIntentId: pr.stripePaymentIntentId,
            reason: "requested_by_customer",
          });
          await prisma.paymentRecord.updateMany({
            where: { bookingId },
            data: { paymentState: "REFUNDED" },
          });
          await prisma.payoutRecord.updateMany({
            where: { bookingId },
            data: { status: "CANCELLED", blockedReason: "Refund issued before payout release." },
          });
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[H-28] Failed to refund PI for booking ${bookingId} — marking REFUND_PENDING`);
          }
          // Override status to REFUND_PENDING so admin knows it needs manual resolution
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              bookingStatus: "REFUND_PENDING",
              cleanerPayoutAmount,
              platformMarginAmount,
            },
          });
          revalidatePath(`/admin/orders/${bookingId}`);
          revalidatePath("/admin/orders");
          return; // Don't proceed with the normal update
        }
      }
    }

    // Transitioning TO REFUNDED: issue refund if payment was captured
    if (bookingStatus === "REFUNDED" && currentBooking.bookingStatus !== "REFUNDED") {
      if (pr.paymentState === "PAID") {
        try {
          await createDirectChargeRefund({
            connectedAccountId: stripeAccountId,
            paymentIntentId: pr.stripePaymentIntentId,
            reason: "requested_by_customer",
          });
          await prisma.paymentRecord.updateMany({
            where: { bookingId },
            data: { paymentState: "REFUNDED" },
          });
          await prisma.payoutRecord.updateMany({
            where: { bookingId },
            data: { status: "CANCELLED", blockedReason: "Refund issued before payout release." },
          });
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[H-28] Failed to refund PI for booking ${bookingId}`);
          }
          throw new Error("Refund failed — please process manually via Stripe dashboard");
        }
      }
    }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: bookingStatus as BookingStatus,
      cleanerPayoutAmount,
      platformMarginAmount,
    },
  });

  // Send status email for key transitions
  const emailStatuses = ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  if (emailStatuses.includes(bookingStatus)) {
    try {
      const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
      await sendBookingStatusEmail(bookingId, bookingStatus);
    } catch { /* non-critical */ }
  }

  revalidatePath(`/admin/orders/${bookingId}`);
  revalidatePath("/admin/orders");
}

export async function confirmBookingOnBehalfAction(formData: FormData) {
  await requireAdminSession();
  const bookingId = String(formData.get("bookingId") || "");

  if (!bookingId) return;

  const prisma = getPrisma();

  // H-27 FIX: Atomically claim the booking via updateMany to prevent race conditions.
  // This ensures two concurrent admin actions can't both capture the same booking.
  const claimResult = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      bookingStatus: "PENDING_ASSIGNMENT",
    },
    data: { bookingStatus: "ACCEPTING" },
  });

  if (claimResult.count === 0) {
    throw new Error("Booking is not waiting for provider confirmation (may have been claimed concurrently)");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking) {
    // Roll back the claim
    await prisma.booking.updateMany({
      where: { id: bookingId, bookingStatus: "ACCEPTING" },
      data: { bookingStatus: "PENDING_ASSIGNMENT" },
    });
    throw new Error("Booking not found");
  }

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
    try {
      await captureDirectChargePaymentIntent({
        connectedAccountId: stripeAccountId,
        paymentIntentId: paymentRecord.stripePaymentIntentId,
      });
    } catch (captureError) {
      // Roll back the claim
      await prisma.booking.updateMany({
        where: { id: bookingId, bookingStatus: "ACCEPTING" },
        data: { bookingStatus: "PENDING_ASSIGNMENT" },
      });
      throw captureError;
    }
  } else {
    await prisma.paymentRecord.updateMany({
      where: { bookingId },
      data: { paymentState: "PAID" },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "ASSIGNED",
        cancelledByType: null,
        cancelledReason: null,
      },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    if (latestJob) {
      await tx.job.update({
        where: { id: latestJob.id },
        data: {
          jobStatus: "ACCEPTED",
          acceptedAt: latestJob.acceptedAt ?? new Date(),
        },
      });
    } else {
      await tx.job.create({
        data: {
          bookingId,
          jobStatus: "ACCEPTED",
          dispatchRound: 1,
          acceptedAt: new Date(),
        },
      });
    }
  });

  try {
    const payout = await ensurePayoutRecordForBooking(bookingId, prisma);
    if (payout) {
      await refreshPayoutRecordState(payout.id, prisma);
    }
  } catch {
    // Non-critical
  }

  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "ASSIGNED");
  } catch {
    // Non-critical
  }

  revalidatePath(`/admin/orders/${bookingId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/bookings");
  revalidatePath(`/provider/orders/${bookingId}`);
  revalidatePath("/provider/orders");
}

export async function createAdminRefundAction(formData: FormData) {
  const admin = await requireAdminSession();
  const prisma = getPrisma();

  const bookingId = String(formData.get("bookingId") || "");
  const refundType = String(formData.get("refundType") || "FULL");
  const reason = String(formData.get("reason") || "requested_by_customer");
  const policyNote = String(formData.get("policyNote") || "").trim();
  const partialAmount = Number(formData.get("partialAmount") || 0);
  const adminPassword = String(formData.get("adminPassword") || "");
  const confirmAmount = Number(formData.get("confirmAmount") || 0);
  const acknowledge = formData.get("acknowledgeRefund") === "on";

  if (!bookingId) {
    redirect("/admin/orders");
  }

  const validPassword = await verifyPassword(adminPassword, admin.passwordHash);
  if (!validPassword) {
    redirect(`/admin/orders/${bookingId}?refundError=Admin password is incorrect.`);
  }

  if (!acknowledge) {
    redirect(`/admin/orders/${bookingId}?refundError=Please confirm the refund acknowledgement before submitting.`);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      payoutRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: {
        select: { stripeConnectedAccount: { select: { stripeAccountId: true } } },
      },
      priceSnapshot: {
        select: {
          customerTotalAmount: true,
          providerExpectedPayout: true,
          platformBookingFee: true,
          platformCommissionAmount: true,
        },
      },
    },
  });

  if (!booking) {
    redirect(`/admin/orders/${bookingId}?refundError=Booking not found`);
  }

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = paymentRecord?.stripeAccountId || booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;
  if (!paymentRecord || paymentRecord.paymentState !== "PAID") {
    redirect(`/admin/orders/${bookingId}?refundError=Only captured payments can be refunded here.`);
  }

  if (!["FULL", "PARTIAL"].includes(refundType)) {
    redirect(`/admin/orders/${bookingId}?refundError=Invalid refund type.`);
  }

  if (refundType === "PARTIAL" && (!Number.isFinite(partialAmount) || partialAmount <= 0)) {
    redirect(`/admin/orders/${bookingId}?refundError=Enter a valid partial refund amount.`);
  }

  const amountInPence = refundType === "PARTIAL" ? Math.round(partialAmount * 100) : undefined;
  const refundAmount = refundType === "PARTIAL" ? partialAmount : Number(paymentRecord.grossAmount);
  const isManualRefund = !paymentRecord.stripePaymentIntentId || !stripeAccountId;

  if (Math.abs(confirmAmount - refundAmount) > 0.009) {
    redirect(`/admin/orders/${bookingId}?refundError=Refund amount confirmation does not match the final refund amount.`);
  }

  try {
    const paymentIntentId = paymentRecord.stripePaymentIntentId;
    const refund = isManualRefund
      ? {
          id: null,
          status: "succeeded",
        }
      : await createDirectChargeRefund({
          connectedAccountId: stripeAccountId,
          paymentIntentId: paymentIntentId as string,
          ...(amountInPence ? { amount: amountInPence } : {}),
          reason: reason === "duplicate" || reason === "fraudulent" ? reason : "requested_by_customer",
        });

    await prisma.refundRecord.create({
      data: {
        bookingId,
        paymentRecordId: paymentRecord.id,
        stripeRefundId: refund.id,
        amount: refundAmount,
        refundReason: isManualRefund
          ? [policyNote, "Manual refund recorded for mock/test payment."].filter(Boolean).join(" ")
          : (policyNote || reason),
        liability: "PLATFORM",
        refundApplicationFee: false,
        status: refund.status === "succeeded" ? "PROCESSED" : "PENDING",
        actorId: admin.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: admin.id,
        actionType: refundType === "PARTIAL" ? "ADMIN_PARTIAL_REFUND_CREATED" : "ADMIN_FULL_REFUND_CREATED",
        entityType: "BOOKING",
        entityId: bookingId,
        oldValues: {
          paymentState: paymentRecord.paymentState,
          bookingStatus: booking.bookingStatus,
          payoutStatus: booking.payoutRecords[0]?.status ?? null,
        },
        newValues: {
          refundType,
          refundAmount,
          reason,
          policyNote,
          isManualRefund,
        },
      },
    });

    const ym = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const existingCount = await prisma.invoiceRecord.count({
      where: { number: { startsWith: `CRN-${ym}-` } },
    });
    await prisma.invoiceRecord.create({
      data: {
        bookingId,
        number: `CRN-${ym}-${String(existingCount + 1).padStart(5, "0")}`,
        strategy: "REFUND_ADJUSTMENT_NOTE",
        issuer: "AreaSorted",
        recipient: `${booking.customerId}`,
        totalAmount: refundAmount,
        currency: "GBP",
        metadataJson: {
          variant: "refund",
          refundType,
          reason,
          policyNote,
          isManualRefund,
          bookingReference: bookingId,
        },
      },
    });

    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        paymentState: refundType === "PARTIAL" ? "PARTIALLY_REFUNDED" : "REFUNDED",
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: refundType === "PARTIAL" ? "REFUND_PENDING" : "REFUNDED",
      },
    });

    const payoutRecord = booking.payoutRecords[0];
    if (payoutRecord) {
      const payoutStatus = payoutRecord.status;
      await prisma.payoutRecord.update({
        where: { id: payoutRecord.id },
        data: ["PAID", "RELEASED"].includes(payoutStatus)
          ? {
              status: "BLOCKED",
              blockedAt: new Date(),
              blockedReason: refundType === "PARTIAL"
                ? `Partial refund issued after payout release. Review provider recovery. ${policyNote}`.trim()
                : `Full refund issued after payout release. Review provider recovery. ${policyNote}`.trim(),
            }
          : {
              status: refundType === "PARTIAL" ? "BLOCKED" : "CANCELLED",
              blockedAt: new Date(),
              blockedReason: refundType === "PARTIAL"
                ? `Partial refund issued before payout release. ${policyNote}`.trim()
                : `Refund issued before payout release. ${policyNote}`.trim(),
            },
      });
    }

    revalidatePath(`/admin/orders/${bookingId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/payouts");
    revalidatePath("/account/bookings");
    redirect(`/admin/orders/${bookingId}?refundStatus=${encodeURIComponent(
      isManualRefund
        ? (refundType === "PARTIAL" ? "Manual partial refund recorded for mock payment." : "Manual full refund recorded for mock payment.")
        : (refundType === "PARTIAL" ? "Partial refund created." : "Full refund created.")
    )}`);
  } catch (error) {
    redirect(`/admin/orders/${bookingId}?refundError=${encodeURIComponent(error instanceof Error ? error.message : "Refund failed")}`);
  }
}

export async function applyRefundPolicyAction(formData: FormData) {
  const admin = await requireAdminSession();
  const prisma = getPrisma();

  const bookingId = String(formData.get("bookingId") || "");
  const policy = String(formData.get("policy") || "");
  const adminPassword = String(formData.get("adminPassword") || "");
  const confirmAmount = Number(formData.get("confirmAmount") || 0);
  const acknowledge = formData.get("acknowledgeRefund") === "on";

  if (!bookingId) {
    redirect("/admin/orders");
  }

  const validPassword = await verifyPassword(adminPassword, admin.passwordHash);
  if (!validPassword) {
    redirect(`/admin/orders/${bookingId}?refundError=Admin password is incorrect.`);
  }

  if (!acknowledge) {
    redirect(`/admin/orders/${bookingId}?refundError=Please confirm the refund acknowledgement before submitting.`);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      priceSnapshot: {
        select: {
          customerTotalAmount: true,
          platformBookingFee: true,
        },
      },
    },
  });

  if (!booking?.paymentRecords[0] || booking.paymentRecords[0].paymentState !== "PAID") {
    redirect(`/admin/orders/${bookingId}?refundError=Policy refunds only apply to captured payments.`);
  }

  let refundType = "FULL";
  let partialAmount = 0;
  let policyNote = "";

  if (policy === "PROVIDER_NO_SHOW") {
    refundType = "FULL";
    policyNote = "Provider no-show - full refund";
  } else if (policy === "CUSTOMER_LATE_CANCEL") {
    refundType = "PARTIAL";
    const total = Number(booking.priceSnapshot?.customerTotalAmount ?? booking.totalAmount);
    const bookingFee = Number(booking.priceSnapshot?.platformBookingFee ?? 0);
    partialAmount = Math.max(0, total - bookingFee);
    policyNote = `Customer cancelled within 24 hours - refund customer less booking fee (${bookingFee.toFixed(2)})`;
  } else {
    redirect(`/admin/orders/${bookingId}?refundError=Unknown refund policy.`);
  }

  const expectedAmount = refundType === "PARTIAL" ? partialAmount : Number(booking.paymentRecords[0].grossAmount);
  if (Math.abs(confirmAmount - expectedAmount) > 0.009) {
    redirect(`/admin/orders/${bookingId}?refundError=Refund amount confirmation does not match the policy refund amount.`);
  }

  const refundForm = new FormData();
  refundForm.set("bookingId", bookingId);
  refundForm.set("refundType", refundType);
  refundForm.set("reason", "requested_by_customer");
  refundForm.set("policyNote", policyNote);
  if (refundType === "PARTIAL") {
    refundForm.set("partialAmount", partialAmount.toFixed(2));
  }

  return createAdminRefundAction(refundForm);
}

// Counter offers are now handled directly between providers and customers.
// Admin has read-only visibility — no accept/reject actions needed.
