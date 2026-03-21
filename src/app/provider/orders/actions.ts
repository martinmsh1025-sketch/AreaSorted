"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { createProviderNotification } from "@/lib/providers/notifications";
import { cancelDirectChargePaymentIntent, captureDirectChargePaymentIntent } from "@/lib/stripe/connect";

/**
 * Provider accepts a booking — captures authorised funds and moves status to ASSIGNED.
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
      bookingStatus: { in: ["PENDING_ASSIGNMENT"] },
    },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking) return;

  const paymentRecord = booking.paymentRecords[0];
  const stripeAccountId = booking.marketplaceProviderCompany?.stripeConnectedAccount?.stripeAccountId;

  if (paymentRecord?.stripePaymentIntentId && stripeAccountId) {
    await captureDirectChargePaymentIntent({
      connectedAccountId: stripeAccountId,
      paymentIntentId: paymentRecord.stripePaymentIntentId,
    });
  } else {
    await prisma.paymentRecord.updateMany({
      where: { bookingId },
      data: { paymentState: "PAID" },
    });
  }

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
    const { sendBookingStatusEmail } = await import("@/lib/notifications/booking-emails");
    await sendBookingStatusEmail(bookingId, "ASSIGNED");
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
