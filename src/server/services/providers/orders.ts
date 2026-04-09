import { getPrisma } from "@/lib/db";
import { createProviderNotification } from "@/lib/providers/notifications";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { cancelDirectChargePaymentIntent, captureDirectChargePaymentIntent } from "@/lib/stripe/connect";
import { ensurePayoutRecordForBooking, refreshPayoutRecordState } from "@/lib/payouts";

export async function acceptProviderBooking(input: {
  providerCompanyId: string;
  bookingId: string;
}) {
  const prisma = getPrisma();

  const claimResult = await prisma.booking.updateMany({
    where: {
      id: input.bookingId,
      providerCompanyId: input.providerCompanyId,
      bookingStatus: "PENDING_ASSIGNMENT",
    },
    data: { bookingStatus: "ACCEPTING" },
  });

  if (claimResult.count === 0) {
    return { ok: false as const, reason: "not_available" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking) {
    return { ok: false as const, reason: "not_found" };
  }

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  try {
    if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
      const capturedIntent = await captureDirectChargePaymentIntent({
        connectedAccountId: stripeAccountId,
        paymentIntentId: paymentRecord.stripePaymentIntentId,
      });

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
        where: { bookingId: input.bookingId },
        data: { paymentState: "PAID" },
      });
    }

    try {
      const payout = await ensurePayoutRecordForBooking(input.bookingId, prisma);
      if (payout) {
        await refreshPayoutRecordState(payout.id, prisma);
      }
    } catch {
      // Non-critical
    }
  } catch (captureError) {
    await prisma.booking.updateMany({
      where: { id: input.bookingId, bookingStatus: "ACCEPTING" },
      data: { bookingStatus: "PENDING_ASSIGNMENT" },
    });
    throw captureError;
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: input.bookingId },
      data: { bookingStatus: "ASSIGNED" },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId: input.bookingId },
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
          bookingId: input.bookingId,
          jobStatus: "ACCEPTED",
          dispatchRound: 1,
          acceptedAt: new Date(),
        },
      });
    }
  });

  try {
    const { sendBookingStatusEmail, sendPaymentCapturedConfirmationEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(input.bookingId, "ASSIGNED");
    await sendPaymentCapturedConfirmationEmail(input.bookingId);
  } catch {
    // Non-critical
  }

  return { ok: true as const };
}

export async function rejectProviderBooking(input: {
  providerCompanyId: string;
  bookingId: string;
  reason?: string;
}) {
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      providerCompanyId: input.providerCompanyId,
      bookingStatus: { in: ["PENDING_ASSIGNMENT"] },
    },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking) {
    return { ok: false as const, reason: "not_available" };
  }

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
    try {
      await cancelDirectChargePaymentIntent({
        connectedAccountId: stripeAccountId,
        paymentIntentId: paymentRecord.stripePaymentIntentId,
      });
    } catch {
      // Non-critical
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: input.bookingId },
      data: {
        bookingStatus: "NO_CLEANER_FOUND",
        cancelledByType: "PROVIDER",
        cancelledReason: input.reason || "Provider declined the booking",
      },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId: input.bookingId },
      orderBy: { createdAt: "desc" },
    });

    if (latestJob && latestJob.jobStatus !== "COMPLETED") {
      await tx.job.update({
        where: { id: latestJob.id },
        data: { jobStatus: "CANCELLED_BY_CLEANER" },
      });
    }

    await tx.paymentRecord.updateMany({
      where: { bookingId: input.bookingId },
      data: { paymentState: "CANCELLED" },
    });
  });

  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(input.bookingId, "NO_CLEANER_FOUND");
  } catch {
    // Non-critical
  }

  return { ok: true as const };
}

export async function startProviderBooking(input: {
  providerCompanyId: string;
  bookingId: string;
}) {
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      providerCompanyId: input.providerCompanyId,
      bookingStatus: "ASSIGNED",
    },
  });

  if (!booking) {
    return { ok: false as const, reason: "not_available" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: input.bookingId },
      data: { bookingStatus: "IN_PROGRESS" },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId: input.bookingId },
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
          bookingId: input.bookingId,
          jobStatus: "ACCEPTED",
          dispatchRound: 1,
          acceptedAt: new Date(),
          startedAt: new Date(),
        },
      });
    }
  });

  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(input.bookingId, "IN_PROGRESS");
  } catch {
    // Non-critical
  }

  return { ok: true as const };
}

export async function completeProviderBooking(input: {
  providerCompanyId: string;
  bookingId: string;
}) {
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      providerCompanyId: input.providerCompanyId,
      bookingStatus: "IN_PROGRESS",
    },
  });

  if (!booking) {
    return { ok: false as const, reason: "not_available" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: input.bookingId },
      data: { bookingStatus: "COMPLETED" },
    });

    const latestJob = await tx.job.findFirst({
      where: { bookingId: input.bookingId },
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
          bookingId: input.bookingId,
          jobStatus: "COMPLETED",
          dispatchRound: 1,
          acceptedAt: new Date(),
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    }
  });

  try {
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(input.bookingId, "COMPLETED");
  } catch {
    // Non-critical
  }

  return { ok: true as const };
}

export async function requestProviderOrderSupport(input: {
  providerCompanyId: string;
  providerName: string;
  providerEmail: string;
  bookingId: string;
  requestType: "RESCHEDULE" | "CANCEL" | "ISSUE";
  message: string;
}) {
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      providerCompanyId: input.providerCompanyId,
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
    return { ok: false as const, reason: "not_available" };
  }

  const supportEmail = process.env.SUPPORT_EMAIL || "support@areasorted.com";
  const customerName = booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Unknown customer";
  const requestLabel = input.requestType === "RESCHEDULE"
    ? "Reschedule request"
    : input.requestType === "CANCEL"
      ? "Cancellation request"
      : "Issue reported";

  await sendTransactionalEmail({
    to: supportEmail,
    subject: `[Provider portal] ${requestLabel} for booking ${booking.id}`,
    text: [
      `Provider: ${input.providerName}`,
      `Provider email: ${input.providerEmail}`,
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
      input.message,
    ].filter(Boolean).join("\n"),
  });

  await createProviderNotification({
    providerCompanyId: input.providerCompanyId,
    type: "SYSTEM_MESSAGE",
    title: requestLabel,
    message: `Your ${requestLabel.toLowerCase()} for booking #${booking.id.slice(0, 8)} has been sent to support.`,
    link: `/provider/orders/${booking.id}`,
    bookingId: booking.id,
  });

  return { ok: true as const, bookingId: booking.id, requestLabel };
}
