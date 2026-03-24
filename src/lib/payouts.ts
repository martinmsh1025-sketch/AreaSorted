import { Prisma, ProviderPayoutStatus } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { getSettingValue } from "@/lib/config/env";

export type PayoutRecordSnapshot = {
  id: string;
  status: ProviderPayoutStatus;
  amount: number;
  holdDays: number | null;
  holdUntil: Date | null;
  availableOn: Date | null;
  releasedAt: Date | null;
  blockedAt: Date | null;
  blockedReason: string | null;
  paidAt: Date | null;
};

type PrismaLike = ReturnType<typeof getPrisma> | Prisma.TransactionClient;

export function addBusinessDays(start: Date, days: number) {
  const result = new Date(start);
  let remaining = Math.max(0, days);
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }
  return result;
}

export async function getProviderPayoutHoldDays(prisma: PrismaLike) {
  const setting = await prisma.adminSetting.findUnique({
    where: { key: "marketplace.provider_payout_hold_days" },
    select: { valueJson: true },
  });
  const raw = Number(getSettingValue<number>(setting, 3));
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 3;
}

export async function isProviderPayoutAutoReleaseEnabled(prisma: PrismaLike) {
  const setting = await prisma.adminSetting.findUnique({
    where: { key: "marketplace.provider_payout_auto_release" },
    select: { valueJson: true },
  });
  return Boolean(Number(getSettingValue<number>(setting, 0)));
}

function toSnapshot(record: {
  id: string;
  status: ProviderPayoutStatus;
  amount: Prisma.Decimal | number;
  holdDays: number | null;
  holdUntil: Date | null;
  availableOn: Date | null;
  releasedAt: Date | null;
  blockedAt: Date | null;
  blockedReason: string | null;
  paidAt: Date | null;
}): PayoutRecordSnapshot {
  return {
    id: record.id,
    status: record.status,
    amount: Number(record.amount),
    holdDays: record.holdDays,
    holdUntil: record.holdUntil,
    availableOn: record.availableOn,
    releasedAt: record.releasedAt,
    blockedAt: record.blockedAt,
    blockedReason: record.blockedReason,
    paidAt: record.paidAt,
  };
}

export async function ensurePayoutRecordForBooking(bookingId: string, prismaClient?: PrismaLike) {
  const prisma = prismaClient ?? getPrisma();
  const existing = await prisma.payoutRecord.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return toSnapshot(existing);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      providerCompanyId: true,
      paymentRecords: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { paymentState: true },
      },
      priceSnapshot: {
        select: { providerExpectedPayout: true },
      },
    },
  });

  if (!booking?.providerCompanyId || !booking.priceSnapshot?.providerExpectedPayout) {
    return null;
  }

  if (booking.paymentRecords[0]?.paymentState !== "PAID") {
    return null;
  }

  const holdDays = await getProviderPayoutHoldDays(prisma);
  const holdUntil = addBusinessDays(new Date(), holdDays);

  const created = await prisma.payoutRecord.create({
    data: {
      bookingId: booking.id,
      providerCompanyId: booking.providerCompanyId,
      amount: booking.priceSnapshot.providerExpectedPayout,
      status: "ON_HOLD",
      holdDays,
      holdUntil,
      availableOn: holdUntil,
    },
  });

  return toSnapshot(created);
}

export async function refreshPayoutRecordState(payoutRecordId: string, prismaClient?: PrismaLike) {
  const prisma = prismaClient ?? getPrisma();
  const payout = await prisma.payoutRecord.findUnique({
    where: { id: payoutRecordId },
    include: {
      booking: {
        select: {
          bookingStatus: true,
          complaints: { select: { id: true }, take: 1 },
          refundRecords: {
            where: { status: { in: ["PENDING", "PROCESSED"] } },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!payout) return null;
  if (["PAID", "FAILED", "CANCELLED", "BLOCKED"].includes(payout.status)) {
    return toSnapshot(payout);
  }

  const hasComplaint = payout.booking.complaints.length > 0;
  const hasRefund = payout.booking.refundRecords.length > 0 || ["REFUND_PENDING", "REFUNDED", "CANCELLED"].includes(payout.booking.bookingStatus);
  const holdUntil = payout.holdUntil ?? payout.availableOn;
  const now = new Date();

  let nextStatus: ProviderPayoutStatus = payout.status;
  if (hasRefund) {
    nextStatus = "CANCELLED";
  } else if (hasComplaint) {
    nextStatus = "ON_HOLD";
  } else if (holdUntil && holdUntil <= now) {
    nextStatus = "ELIGIBLE";
  } else if (payout.status === "PENDING" || payout.status === "CREATED") {
    nextStatus = "ON_HOLD";
  }

  if (nextStatus === payout.status) {
    return toSnapshot(payout);
  }

  const updated = await prisma.payoutRecord.update({
    where: { id: payout.id },
    data: {
      status: nextStatus,
      ...(nextStatus === "ELIGIBLE" ? { availableOn: holdUntil ?? now } : {}),
      ...(nextStatus === "CANCELLED" ? { blockedReason: payout.blockedReason ?? "Refund or cancellation applied before payout release." } : {}),
    },
  });

  return toSnapshot(updated);
}
