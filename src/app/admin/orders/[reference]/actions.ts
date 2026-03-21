"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { isAdminAuthenticated, requireAdminSession } from "@/lib/admin-auth";
import { captureDirectChargePaymentIntent } from "@/lib/stripe/connect";

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
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      marketplaceProviderCompany: { include: { stripeConnectedAccount: true } },
    },
  });

  if (!booking || booking.bookingStatus !== "PENDING_ASSIGNMENT") {
    throw new Error("Booking is not waiting for provider confirmation");
  }

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

// Counter offers are now handled directly between providers and customers.
// Admin has read-only visibility — no accept/reject actions needed.
