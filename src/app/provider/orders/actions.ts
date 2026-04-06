"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { createProviderNotification } from "@/lib/providers/notifications";
import { cancelDirectChargePaymentIntent, captureDirectChargePaymentIntent } from "@/lib/stripe/connect";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { ensurePayoutRecordForBooking, refreshPayoutRecordState } from "@/lib/payouts";

/**
 * Provider accepts a booking — captures authorised funds and moves status to ASSIGNED.
 */
export async function acceptBookingAction(formData: FormData) {
  const session = await requireProviderOrdersAccess();
  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;

  const prisma = getPrisma();

  // C2+C3 FIX: Atomically claim the booking to prevent race with customer cancel.
  // This acts as a distributed lock — only one actor can move from PENDING_ASSIGNMENT.
  const claimResult = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: "PENDING_ASSIGNMENT",
    },
    data: { bookingStatus: "ACCEPTING" },
  });

  if (claimResult.count === 0) return; // Already cancelled, accepted, or not found

  // Load payment details now that we've claimed the booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking) return;

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  // C3 FIX: Capture Stripe funds AFTER claiming the booking but BEFORE finalising.
  // If capture fails, roll back the claim so the booking can be retried or cancelled.
  try {
    if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
      const capturedIntent = await captureDirectChargePaymentIntent({
        connectedAccountId: stripeAccountId,
        paymentIntentId: paymentRecord.stripePaymentIntentId,
      });

      // H-25 FIX: Backfill stripeChargeId from the captured PaymentIntent
      const chargeId = capturedIntent.latest_charge;
      if (chargeId) {
        await prisma.paymentRecord.update({
          where: { id: paymentRecord.id },
          data: {
            stripeChargeId: typeof chargeId === "string" ? chargeId : chargeId.id,
          },
        });
      }
  } else {
    await prisma.paymentRecord.updateMany({
      where: { bookingId },
      data: { paymentState: "PAID" },
    });
  }

  try {
    const payout = await ensurePayoutRecordForBooking(bookingId, prisma);
    if (payout) {
      await refreshPayoutRecordState(payout.id, prisma);
    }
  } catch {
    // Non-critical
  }
  } catch (captureError) {
    // Roll back the claim — restore to PENDING_ASSIGNMENT so it can be retried
    await prisma.booking.updateMany({
      where: { id: bookingId, bookingStatus: "ACCEPTING" },
      data: { bookingStatus: "PENDING_ASSIGNMENT" },
    });
    throw captureError;
  }

  // Now finalise the booking status and job in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { bookingStatus: "ASSIGNED" },
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

  // Notify customer
  try {
    const { sendBookingStatusEmail, sendPaymentCapturedConfirmationEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "ASSIGNED");
    await sendPaymentCapturedConfirmationEmail(bookingId);
  } catch { /* non-critical */ }

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

  const prisma = getPrisma();

  // Verify the booking belongs to this provider and is in a rejectable state
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: { in: ["PENDING_ASSIGNMENT"] },
    },
    include: {
      quoteRequest: true,
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking) return;

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
    try {
      await cancelDirectChargePaymentIntent({
        connectedAccountId: stripeAccountId,
        paymentIntentId: paymentRecord.stripePaymentIntentId,
      });
    } catch {
      // Non-critical: cron/admin can reconcile if Stripe cancellation fails.
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "NO_CLEANER_FOUND",
        cancelledByType: "PROVIDER",
        cancelledReason: reason || "Provider declined the booking",
      },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    if (latestJob && latestJob.jobStatus !== "COMPLETED") {
      await tx.job.update({
        where: { id: latestJob.id },
        data: { jobStatus: "CANCELLED_BY_CLEANER" },
      });
    }
    await tx.paymentRecord.updateMany({
      where: { bookingId },
      data: { paymentState: "CANCELLED" },
    });
  });

  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "NO_CLEANER_FOUND");
  } catch {
    // Non-critical
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

  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: "ASSIGNED",
    },
  });

  if (!booking) return;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { bookingStatus: "IN_PROGRESS" },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    if (latestJob) {
      await tx.job.update({
        where: { id: latestJob.id },
        data: {
          startedAt: latestJob.startedAt ?? new Date(),
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
          startedAt: new Date(),
        },
      });
    }
  });

  // Notify customer
  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "IN_PROGRESS");
  } catch { /* non-critical */ }

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

  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: "IN_PROGRESS",
    },
  });

  if (!booking) return;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { bookingStatus: "COMPLETED" },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    if (latestJob) {
      await tx.job.update({
        where: { id: latestJob.id },
        data: {
          jobStatus: "COMPLETED",
          acceptedAt: latestJob.acceptedAt ?? new Date(),
          startedAt: latestJob.startedAt ?? new Date(),
          completedAt: new Date(),
        },
      });
    } else {
      await tx.job.create({
        data: {
          bookingId,
          jobStatus: "COMPLETED",
          dispatchRound: 1,
          acceptedAt: new Date(),
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    }
  });

  // Notify customer
  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "COMPLETED");
  } catch { /* non-critical */ }

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

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      providerCompanyId: session.providerCompany.id,
      bookingStatus: { in: ["ASSIGNED", "IN_PROGRESS"] },
    },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!booking) {
    redirect(`/provider/orders/${bookingId}?supportError=This request is only available for accepted or in-progress orders.`);
  }

  const supportEmail = process.env.SUPPORT_EMAIL || "support@areasorted.com";
  const providerName = session.providerCompany.tradingName || session.providerCompany.legalName || session.providerCompany.contactEmail;
  const customerName = booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Unknown customer";
  const requestLabel = requestType === "RESCHEDULE"
    ? "Reschedule request"
    : requestType === "CANCEL"
      ? "Cancellation request"
      : "Issue reported";

  await sendTransactionalEmail({
    to: supportEmail,
    subject: `[Provider portal] ${requestLabel} for booking ${booking.id}`,
    text: [
      `Provider: ${providerName}`,
      `Provider email: ${session.providerCompany.contactEmail}`,
      `Booking ID: ${booking.id}`,
      `Request type: ${requestLabel}`,
      `Booking status: ${booking.bookingStatus}`,
      `Scheduled date: ${booking.scheduledDate.toISOString()}`,
      `Scheduled start time: ${booking.scheduledStartTime || "N/A"}`,
      `Service postcode: ${booking.servicePostcode}`,
      `Customer: ${customerName}`,
      booking.customer?.email ? `Customer email: ${booking.customer.email}` : "",
      "",
      "Provider message:",
      message,
    ].filter(Boolean).join("\n"),
  });

  await createProviderNotification({
    providerCompanyId: session.providerCompany.id,
    type: "SYSTEM_MESSAGE",
    title: requestLabel,
    message: `Your ${requestLabel.toLowerCase()} for booking #${booking.id.slice(0, 8)} has been sent to support.`,
    link: `/provider/orders/${booking.id}`,
    bookingId: booking.id,
  });

  revalidatePath(`/provider/orders/${booking.id}`);
  revalidatePath("/provider/notifications");
  redirect(`/provider/orders/${booking.id}?supportStatus=${encodeURIComponent(`${requestLabel} sent to support.`)}`);
}
