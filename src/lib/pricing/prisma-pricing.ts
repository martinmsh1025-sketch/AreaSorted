import { getPrisma } from "@/lib/db";

export type ProviderPricingPortalRow = {
  id: string;
  providerCompanyId: string;
  categoryKey: string;
  serviceKey: string;
  pricingMode: string;
  flatPrice: number | null;
  hourlyPrice: number | null;
  minimumCharge: number | null;
  travelFee: number | null;
  sameDayUplift: number | null;
  weekendUplift: number | null;
  customQuoteRequired: boolean;
  pricingJson: Record<string, unknown> | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PricingPreviewInput = {
  providerCompanyId: string;
  categoryKey: string;
  serviceKey: string;
  postcodePrefix: string;
  estimatedHours?: number;
  quantity?: number;
  sameDay?: boolean;
  weekend?: boolean;
};

export type PricingPreviewResult = {
  providerBasePrice: number;
  bookingFee: number;
  commissionAmount: number;
  totalCustomerPay: number;
  expectedProviderPayoutBeforeStripeFees: number;
  pricingRuleId: string;
  quoteRequired: boolean;
  postcodeSurcharge: number;
};

function asNumber(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function listProviderPricingRules(providerCompanyId: string): Promise<ProviderPricingPortalRow[]> {
  const prisma = getPrisma();
  const rules = await prisma.providerPricingRule.findMany({
    where: { providerCompanyId },
    orderBy: [{ categoryKey: "asc" }, { serviceKey: "asc" }],
  });

  return rules.map((rule) => ({
    id: rule.id,
    providerCompanyId: rule.providerCompanyId,
    categoryKey: rule.categoryKey,
    serviceKey: rule.serviceKey,
    pricingMode: rule.pricingMode,
    flatPrice: asNumber(rule.flatPrice),
    hourlyPrice: asNumber(rule.hourlyPrice),
    minimumCharge: asNumber(rule.minimumCharge),
    travelFee: asNumber(rule.travelFee),
    sameDayUplift: asNumber(rule.sameDayUplift),
    weekendUplift: asNumber(rule.weekendUplift),
    customQuoteRequired: rule.customQuoteRequired,
    pricingJson: (rule.pricingJson as Record<string, unknown> | null) ?? null,
    active: rule.active,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  }));
}

export async function countActiveProviderPricingRules(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerPricingRule.count({
    where: {
      providerCompanyId,
      active: true,
    },
  });
}

export async function listPricingAuditLogs(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.pricingAuditLog.findMany({
    where: { providerCompanyId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listPricingAreaOverrides(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.pricingAreaOverride.findMany({
    where: { providerCompanyId },
    orderBy: [{ categoryKey: "asc" }, { postcodePrefix: "asc" }],
  });
}

async function createAuditLog(input: {
  providerCompanyId: string;
  providerPricingRuleId?: string;
  actorType: "ADMIN" | "PROVIDER";
  actorId?: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  const prisma = getPrisma();
  await prisma.pricingAuditLog.create({
    data: {
      providerCompanyId: input.providerCompanyId,
      providerPricingRuleId: input.providerPricingRuleId,
      actorType: input.actorType,
      actorId: input.actorId,
      action: input.action,
      beforeJson: input.beforeJson == null ? undefined : JSON.parse(JSON.stringify(input.beforeJson)),
      afterJson: input.afterJson == null ? undefined : JSON.parse(JSON.stringify(input.afterJson)),
    },
  });
}

export async function saveProviderPricingRule(input: {
  providerCompanyId: string;
  categoryKey: string;
  serviceKey: string;
  pricingMode: string;
  flatPrice?: number | null;
  hourlyPrice?: number | null;
  minimumCharge?: number | null;
  travelFee?: number | null;
  sameDayUplift?: number | null;
  weekendUplift?: number | null;
  customQuoteRequired: boolean;
  active: boolean;
  actorType: "ADMIN" | "PROVIDER";
  actorId?: string;
}) {
  const prisma = getPrisma();
  const existing = await prisma.providerPricingRule.findFirst({
    where: {
      providerCompanyId: input.providerCompanyId,
      categoryKey: input.categoryKey,
      serviceKey: input.serviceKey,
    },
  });

  const saved = await prisma.providerPricingRule.upsert({
    where: {
      providerCompanyId_categoryKey_serviceKey: {
        providerCompanyId: input.providerCompanyId,
        categoryKey: input.categoryKey,
        serviceKey: input.serviceKey,
      },
    },
    update: {
      pricingMode: input.pricingMode,
      flatPrice: input.flatPrice ?? null,
      hourlyPrice: input.hourlyPrice ?? null,
      minimumCharge: input.minimumCharge ?? null,
      travelFee: input.travelFee ?? null,
      sameDayUplift: input.sameDayUplift ?? null,
      weekendUplift: input.weekendUplift ?? null,
      customQuoteRequired: input.customQuoteRequired,
      active: input.active,
    },
    create: {
      providerCompanyId: input.providerCompanyId,
      categoryKey: input.categoryKey,
      serviceKey: input.serviceKey,
      pricingMode: input.pricingMode,
      flatPrice: input.flatPrice ?? null,
      hourlyPrice: input.hourlyPrice ?? null,
      minimumCharge: input.minimumCharge ?? null,
      travelFee: input.travelFee ?? null,
      sameDayUplift: input.sameDayUplift ?? null,
      weekendUplift: input.weekendUplift ?? null,
      customQuoteRequired: input.customQuoteRequired,
      active: input.active,
    },
  });

  await createAuditLog({
    providerCompanyId: input.providerCompanyId,
    providerPricingRuleId: saved.id,
    actorType: input.actorType,
    actorId: input.actorId,
    action: existing ? "pricing_rule.updated" : "pricing_rule.created",
    beforeJson: existing,
    afterJson: saved,
  });

  return saved;
}

export async function disableProviderPricingRule(input: {
  providerPricingRuleId: string;
  actorType: "ADMIN" | "PROVIDER";
  actorId?: string;
}) {
  const prisma = getPrisma();
  const existing = await prisma.providerPricingRule.findUnique({ where: { id: input.providerPricingRuleId } });
  if (!existing) throw new Error("Pricing rule not found");

  const updated = await prisma.providerPricingRule.update({
    where: { id: input.providerPricingRuleId },
    data: { active: false },
  });

  await createAuditLog({
    providerCompanyId: existing.providerCompanyId,
    providerPricingRuleId: existing.id,
    actorType: input.actorType,
    actorId: input.actorId,
    action: "pricing_rule.disabled",
    beforeJson: existing,
    afterJson: updated,
  });

  return updated;
}

export async function deleteProviderPricingRule(input: {
  providerPricingRuleId: string;
  actorType: "ADMIN" | "PROVIDER";
  actorId?: string;
}) {
  const prisma = getPrisma();
  const existing = await prisma.providerPricingRule.findUnique({ where: { id: input.providerPricingRuleId } });
  if (!existing) throw new Error("Pricing rule not found");

  await prisma.providerPricingRule.delete({ where: { id: input.providerPricingRuleId } });

  await createAuditLog({
    providerCompanyId: existing.providerCompanyId,
    actorType: input.actorType,
    actorId: input.actorId,
    action: "pricing_rule.deleted",
    beforeJson: existing,
  });
}

export async function savePricingAreaOverride(input: {
  providerCompanyId: string;
  categoryKey: string;
  postcodePrefix: string;
  surchargeAmount: number;
  bookingFeeOverride?: number | null;
  commissionPercentOverride?: number | null;
  active: boolean;
  actorType: "ADMIN" | "PROVIDER";
  actorId?: string;
}) {
  const prisma = getPrisma();
  const existing = await prisma.pricingAreaOverride.findFirst({
    where: {
      providerCompanyId: input.providerCompanyId,
      categoryKey: input.categoryKey,
      postcodePrefix: input.postcodePrefix.toUpperCase(),
    },
  });

  const saved = await prisma.pricingAreaOverride.upsert({
    where: {
      providerCompanyId_categoryKey_postcodePrefix: {
        providerCompanyId: input.providerCompanyId,
        categoryKey: input.categoryKey,
        postcodePrefix: input.postcodePrefix.toUpperCase(),
      },
    },
    update: {
      surchargeAmount: input.surchargeAmount,
      bookingFeeOverride: input.bookingFeeOverride ?? null,
      commissionPercentOverride: input.commissionPercentOverride ?? null,
      active: input.active,
    },
    create: {
      providerCompanyId: input.providerCompanyId,
      categoryKey: input.categoryKey,
      postcodePrefix: input.postcodePrefix.toUpperCase(),
      surchargeAmount: input.surchargeAmount,
      bookingFeeOverride: input.bookingFeeOverride ?? null,
      commissionPercentOverride: input.commissionPercentOverride ?? null,
      active: input.active,
    },
  });

  await createAuditLog({
    providerCompanyId: input.providerCompanyId,
    actorType: input.actorType,
    actorId: input.actorId,
    action: existing ? "pricing_area_override.updated" : "pricing_area_override.created",
    beforeJson: existing,
    afterJson: saved,
  });

  return saved;
}

export async function previewProviderPricing(input: PricingPreviewInput): Promise<PricingPreviewResult> {
  const prisma = getPrisma();

  const [rule, bookingFeeSetting, commissionSetting, areaOverride] = await Promise.all([
    prisma.providerPricingRule.findFirst({
      where: {
        providerCompanyId: input.providerCompanyId,
        categoryKey: input.categoryKey,
        serviceKey: input.serviceKey,
        active: true,
      },
    }),
    prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee" } }),
    prisma.adminSetting.findUnique({ where: { key: "marketplace.commission_percent" } }),
    prisma.pricingAreaOverride.findFirst({
      where: {
        providerCompanyId: input.providerCompanyId,
        categoryKey: input.categoryKey,
        postcodePrefix: input.postcodePrefix.toUpperCase(),
        active: true,
      },
    }),
  ]);

  if (!rule) throw new Error("Provider pricing rule not found");

  let providerBasePrice = 0;
  const quantity = Math.max(input.quantity ?? 1, 1);
  const hours = Math.max(input.estimatedHours ?? 1, 1);

  if (rule.pricingMode === "flat") {
    providerBasePrice = (asNumber(rule.flatPrice) ?? 0) * quantity;
  } else if (rule.pricingMode === "hourly") {
    providerBasePrice = (asNumber(rule.hourlyPrice) ?? 0) * hours;
  } else {
    providerBasePrice = asNumber(rule.minimumCharge) ?? asNumber(rule.flatPrice) ?? 0;
  }

  providerBasePrice = Math.max(providerBasePrice, asNumber(rule.minimumCharge) ?? 0);
  providerBasePrice += asNumber(rule.travelFee) ?? 0;
  if (input.sameDay) providerBasePrice += asNumber(rule.sameDayUplift) ?? 0;
  if (input.weekend) providerBasePrice += asNumber(rule.weekendUplift) ?? 0;

  const quoteRequired = rule.customQuoteRequired;
  const bookingFee = Number((areaOverride?.bookingFeeOverride ?? (bookingFeeSetting?.valueJson as any)?.value) ?? 12);
  const commissionPercent = Number((areaOverride?.commissionPercentOverride ?? (commissionSetting?.valueJson as any)?.value) ?? 18);
  const postcodeSurcharge = asNumber(areaOverride?.surchargeAmount) ?? 0;

  const commissionAmount = roundMoney(providerBasePrice * (commissionPercent / 100));
  const totalCustomerPay = roundMoney(providerBasePrice + bookingFee + commissionAmount + postcodeSurcharge);
  const expectedProviderPayoutBeforeStripeFees = roundMoney(providerBasePrice + postcodeSurcharge);

  return {
    providerBasePrice: roundMoney(providerBasePrice),
    bookingFee: roundMoney(bookingFee),
    commissionAmount,
    totalCustomerPay,
    expectedProviderPayoutBeforeStripeFees,
    pricingRuleId: rule.id,
    quoteRequired,
    postcodeSurcharge: roundMoney(postcodeSurcharge),
  };
}
