"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { addBusinessDays } from "@/lib/payouts";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function savePayoutPolicyAction(formData: FormData) {
  await requireAdminSession();
  const prisma = getPrisma();

  const holdDays = Math.max(0, parseNumber(formData.get("holdDays"), 3));
  const autoRelease = formData.get("autoRelease") === "on" ? 1 : 0;

  await prisma.adminSetting.upsert({
    where: { key: "marketplace.provider_payout_hold_days" },
    update: { valueJson: { value: holdDays } },
    create: { key: "marketplace.provider_payout_hold_days", valueJson: { value: holdDays } },
  });

  await prisma.adminSetting.upsert({
    where: { key: "marketplace.provider_payout_auto_release" },
    update: { valueJson: { value: autoRelease } },
    create: { key: "marketplace.provider_payout_auto_release", valueJson: { value: autoRelease } },
  });

  revalidatePath("/admin/payouts");
}

export async function releasePayoutAction(formData: FormData) {
  const admin = await requireAdminSession();
  const prisma = getPrisma();
  const payoutRecordId = String(formData.get("payoutRecordId") || "");
  if (!payoutRecordId) redirect("/admin/payouts");

  await prisma.payoutRecord.update({
    where: { id: payoutRecordId },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
      releasedByAdminId: admin.id,
      blockedAt: null,
      blockedReason: null,
    },
  });

  revalidatePath("/admin/payouts");
}

export async function blockPayoutAction(formData: FormData) {
  await requireAdminSession();
  const prisma = getPrisma();
  const payoutRecordId = String(formData.get("payoutRecordId") || "");
  const reason = String(formData.get("reason") || "").trim() || "Blocked by admin";
  if (!payoutRecordId) redirect("/admin/payouts");

  await prisma.payoutRecord.update({
    where: { id: payoutRecordId },
    data: {
      status: "BLOCKED",
      blockedAt: new Date(),
      blockedReason: reason,
    },
  });

  revalidatePath("/admin/payouts");
}

export async function extendPayoutHoldAction(formData: FormData) {
  await requireAdminSession();
  const prisma = getPrisma();
  const payoutRecordId = String(formData.get("payoutRecordId") || "");
  const extraDays = Math.max(1, parseNumber(formData.get("extraDays"), 3));
  if (!payoutRecordId) redirect("/admin/payouts");

  const current = await prisma.payoutRecord.findUnique({
    where: { id: payoutRecordId },
    select: { holdUntil: true, holdDays: true },
  });
  if (!current) redirect("/admin/payouts");

  const base = current.holdUntil ?? new Date();
  const holdUntil = addBusinessDays(base, extraDays);

  await prisma.payoutRecord.update({
    where: { id: payoutRecordId },
    data: {
      status: "ON_HOLD",
      holdUntil,
      availableOn: holdUntil,
      holdDays: (current.holdDays ?? 0) + extraDays,
      blockedAt: null,
      blockedReason: null,
      releasedAt: null,
      releasedByAdminId: null,
    },
  });

  revalidatePath("/admin/payouts");
}
