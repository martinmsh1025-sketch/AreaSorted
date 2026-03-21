import { getPrisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { estimateCleaningHours, roundMoney } from "@/lib/pricing/shared-pricing";

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
  /** Cleaning-specific inputs */
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  cleaningCondition?: "light" | "standard" | "heavy" | "very-heavy";
  supplies?: "customer" | "provider";
  propertyType?: string;
  /** Pest Control / general size selector */
  jobSize?: "small" | "standard" | "large";
  /** Add-on keys from the job type catalog */
  addOns?: string[];
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
  optionalExtrasAmount: number;
};

function asNumber(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  pricingJson?: Prisma.InputJsonValue | null;
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
      pricingJson: input.pricingJson ?? undefined,
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
      pricingJson: input.pricingJson ?? undefined,
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

export async function toggleProviderPricingRule(input: {
  providerPricingRuleId: string;
  actorType: "ADMIN" | "PROVIDER";
  actorId?: string;
}) {
  const prisma = getPrisma();
  const existing = await prisma.providerPricingRule.findUnique({ where: { id: input.providerPricingRuleId } });
  if (!existing) throw new Error("Pricing rule not found");

  const newActive = !existing.active;
  const updated = await prisma.providerPricingRule.update({
    where: { id: input.providerPricingRuleId },
    data: { active: newActive },
  });

  await createAuditLog({
    providerCompanyId: existing.providerCompanyId,
    providerPricingRuleId: existing.id,
    actorType: input.actorType,
    actorId: input.actorId,
    action: newActive ? "pricing_rule.enabled" : "pricing_rule.disabled",
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

/**
 * Get the price for a pest control job from pricingJson size tiers or fallback to flatPrice.
 */
function getPestControlPrice(
  rule: { flatPrice: unknown; pricingJson: unknown },
  jobSize: "small" | "standard" | "large",
): number {
  const json = rule.pricingJson as Record<string, unknown> | null;
  if (json && typeof json === "object") {
    const sizePrice = asNumber(json[jobSize]);
    if (sizePrice != null && sizePrice > 0) return sizePrice;
  }
  // Fallback to flatPrice
  return asNumber(rule.flatPrice) ?? 0;
}

/**
 * Calculate the total add-on price from catalog by matching selected add-on keys.
 */
function calculateAddOnsTotal(serviceKey: string, addOnKeys?: string[]): number {
  if (!addOnKeys || addOnKeys.length === 0) return 0;
  const jobType = jobTypeCatalog.find((j) => j.value === serviceKey);
  if (!jobType) return 0;
  return jobType.addOns
    .filter((addOn) => addOnKeys.includes(addOn.value))
    .reduce((sum, addOn) => sum + addOn.amount, 0);
}

export async function previewProviderPricing(input: PricingPreviewInput): Promise<PricingPreviewResult> {
  const prisma = getPrisma();

  const [rule, bookingFeeSetting, bookingFeeModeSetting, commissionSetting, areaOverride] = await Promise.all([
    prisma.providerPricingRule.findFirst({
      where: {
        providerCompanyId: input.providerCompanyId,
        categoryKey: input.categoryKey,
        serviceKey: input.serviceKey,
        active: true,
      },
    }),
    prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee" } }),
    prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee_mode" } }),
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
  const pricingMode = rule.pricingMode || "hourly";

  // ── Calculate add-ons total from catalog ──
  const addOnsTotal = calculateAddOnsTotal(input.serviceKey, input.addOns);

  if (input.categoryKey === "CLEANING") {
    // ── Cleaning: two modes ──
    if (pricingMode === "fixed_per_size") {
      // Provider set fixed prices per size in pricingJson
      const json = rule.pricingJson as Record<string, unknown> | null;
      const size = input.jobSize || "standard";
      providerBasePrice = (json && asNumber(json[size])) || asNumber(rule.flatPrice) || 0;
    } else {
      // hourly mode: system estimates hours from bedrooms/bathrooms/kitchens/condition/propertyType
      const hourlyRate = asNumber(rule.hourlyPrice) ?? 0;
      let hours: number;
      if (input.bedrooms != null || input.bathrooms != null) {
        hours = estimateCleaningHours(
          input.bedrooms ?? 1,
          input.bathrooms ?? 1,
          input.kitchens ?? 1,
          input.propertyType,
          input.cleaningCondition,
        );
      } else {
        hours = Math.max(input.estimatedHours ?? 2, 1);
      }
      providerBasePrice = hourlyRate * hours;
    }

    // Supplies surcharge: +£12 if provider brings supplies
    if (input.supplies === "provider") {
      providerBasePrice += 12;
    }
  } else if (input.categoryKey === "PEST_CONTROL") {
    // ── Pest Control: fixed price per job size ──
    const size = input.jobSize || "standard";
    providerBasePrice = getPestControlPrice(rule, size);
    // If provider only set hourlyPrice (legacy), fall back to hourly * estimated hours
    if (providerBasePrice <= 0) {
      const hourlyRate = asNumber(rule.hourlyPrice) ?? 0;
      const hours = Math.max(input.estimatedHours ?? 2, 1);
      providerBasePrice = hourlyRate * hours;
    }
  } else {
    // ── All other categories: try fixed_per_size from pricingJson, fallback to hourly ──
    if (pricingMode === "fixed_per_size" && input.jobSize) {
      const json = rule.pricingJson as Record<string, unknown> | null;
      const sizePrice = json && asNumber(json[input.jobSize]);
      if (sizePrice != null && sizePrice > 0) {
        providerBasePrice = sizePrice;
      } else {
        // Fallback to hourly
        const hours = Math.max(input.estimatedHours ?? 1, 1);
        providerBasePrice = (asNumber(rule.hourlyPrice) ?? 0) * hours;
      }
    } else {
      const hours = Math.max(input.estimatedHours ?? 1, 1);
      providerBasePrice = (asNumber(rule.hourlyPrice) ?? 0) * hours;
    }
  }

  // Add add-ons to provider base price
  providerBasePrice += addOnsTotal;

  providerBasePrice = Math.max(providerBasePrice, asNumber(rule.minimumCharge) ?? 0);
  providerBasePrice += asNumber(rule.travelFee) ?? 0;
  if (input.sameDay) providerBasePrice += asNumber(rule.sameDayUplift) ?? 0;
  if (input.weekend) providerBasePrice += asNumber(rule.weekendUplift) ?? 0;

  const quoteRequired = rule.customQuoteRequired;

  // Booking fee: supports fixed amount or percentage of provider base price
  const bookingFeeMode = ((bookingFeeModeSetting?.valueJson as any)?.value as string) || "fixed";
  const bookingFeeValue = Number((areaOverride?.bookingFeeOverride ?? (bookingFeeSetting?.valueJson as any)?.value) ?? 12);
  const bookingFee = bookingFeeMode === "percent"
    ? roundMoney(providerBasePrice * (bookingFeeValue / 100))
    : bookingFeeValue;

  const commissionPercent = Number((areaOverride?.commissionPercentOverride ?? (commissionSetting?.valueJson as any)?.value) ?? 12);
  const postcodeSurcharge = asNumber(areaOverride?.surchargeAmount) ?? 0;

  const commissionAmount = roundMoney(providerBasePrice * (commissionPercent / 100));
  // Commission is an internal platform margin — NOT charged to the customer.
  // Customer pays: providerBasePrice + bookingFee + postcodeSurcharge only.
  // Commission is deducted from provider payout at settlement time.
  const totalCustomerPay = roundMoney(providerBasePrice + bookingFee + postcodeSurcharge);
  const expectedProviderPayoutBeforeStripeFees = roundMoney(providerBasePrice - commissionAmount + postcodeSurcharge);

  return {
    providerBasePrice: roundMoney(providerBasePrice),
    bookingFee: roundMoney(bookingFee),
    commissionAmount,
    totalCustomerPay,
    expectedProviderPayoutBeforeStripeFees,
    pricingRuleId: rule.id,
    quoteRequired,
    postcodeSurcharge: roundMoney(postcodeSurcharge),
    optionalExtrasAmount: roundMoney(addOnsTotal),
  };
}
