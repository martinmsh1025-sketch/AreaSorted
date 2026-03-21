"use server";

import { revalidatePath } from "next/cache";
import { requireProviderPricingAccess } from "@/lib/provider-auth";
import {
  deleteProviderPricingRule,
  toggleProviderPricingRule,
  saveProviderPricingRule,
} from "@/lib/pricing/prisma-pricing";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";
import type { Prisma } from "@prisma/client";

/** Parse a form value to number. Returns null for empty/missing values, 0 for "0". */
function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const str = String(value).trim();
  if (str === "") return null;
  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveProviderPricingAction(formData: FormData) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;

  const pricingMode = String(formData.get("pricingMode") || "hourly");

  // Build pricingJson from size price inputs (used for fixed_per_size mode)
  let pricingJson: Prisma.InputJsonValue | null = null;
  const smallPrice = parseNumber(formData.get("sizePrice_small"));
  const standardPrice = parseNumber(formData.get("sizePrice_standard"));
  const largePrice = parseNumber(formData.get("sizePrice_large"));

  if (pricingMode === "fixed_per_size" && (smallPrice != null || standardPrice != null || largePrice != null)) {
    pricingJson = {
      small: smallPrice ?? 0,
      standard: standardPrice ?? 0,
      large: largePrice ?? 0,
    };
  }

  await saveProviderPricingRule({
    providerCompanyId,
    categoryKey: String(formData.get("categoryKey") || ""),
    serviceKey: String(formData.get("serviceKey") || ""),
    pricingMode,
    hourlyPrice: pricingMode === "hourly" ? parseNumber(formData.get("hourlyPrice")) : null,
    flatPrice: null,
    minimumCharge: parseNumber(formData.get("minimumCharge")),
    sameDayUplift: parseNumber(formData.get("sameDayUplift")),
    weekendUplift: parseNumber(formData.get("weekendUplift")),
    customQuoteRequired: formData.get("customQuoteRequired") === "on",
    pricingJson,
    active: formData.get("active") === "on",
    actorType: "PROVIDER",
    actorId: providerCompanyId,
  });

  await syncProviderLifecycleState(providerCompanyId);
  revalidatePath("/provider/pricing");
}

/**
 * Bulk save: accepts JSON-encoded array of pricing rule payloads.
 * Each item has: serviceKey, categoryKey, pricingMode, hourlyPrice, sameDayUplift,
 * weekendUplift, minimumCharge, customQuoteRequired, active, pricingJson (for fixed_per_size).
 */
export async function bulkSaveProviderPricingAction(formData: FormData) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;

  const rawRules = formData.get("rules");
  if (!rawRules) return;

  type RulePayload = {
    serviceKey: string;
    categoryKey: string;
    pricingMode: string;
    hourlyPrice: number | null;
    sameDayUplift: number | null;
    weekendUplift: number | null;
    minimumCharge: number | null;
    customQuoteRequired: boolean;
    active: boolean;
    pricingJson: Record<string, number> | null;
  };

  let rules: RulePayload[];
  try {
    rules = JSON.parse(String(rawRules));
  } catch {
    return;
  }

  if (!Array.isArray(rules)) return;

  await Promise.all(
    rules.map((r) => {
      let pricingJson: Prisma.InputJsonValue | null = null;
      if (r.pricingMode === "fixed_per_size" && r.pricingJson) {
        pricingJson = r.pricingJson;
      }

      return saveProviderPricingRule({
        providerCompanyId,
        categoryKey: r.categoryKey,
        serviceKey: r.serviceKey,
        pricingMode: r.pricingMode,
        hourlyPrice: r.pricingMode === "hourly" ? r.hourlyPrice : null,
        flatPrice: null,
        minimumCharge: r.minimumCharge,
        sameDayUplift: r.sameDayUplift,
        weekendUplift: r.weekendUplift,
        customQuoteRequired: r.customQuoteRequired,
        pricingJson,
        active: r.active,
        actorType: "PROVIDER",
        actorId: providerCompanyId,
      });
    })
  );

  await syncProviderLifecycleState(providerCompanyId);
  revalidatePath("/provider/pricing");
}

export async function toggleProviderPricingAction(formData: FormData) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;

  await toggleProviderPricingRule({
    providerPricingRuleId: String(formData.get("providerPricingRuleId") || ""),
    actorType: "PROVIDER",
    actorId: providerCompanyId,
  });

  await syncProviderLifecycleState(providerCompanyId);
  revalidatePath("/provider/pricing");
}

export async function deleteProviderPricingAction(formData: FormData) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;

  await deleteProviderPricingRule({
    providerPricingRuleId: String(formData.get("providerPricingRuleId") || ""),
    actorType: "PROVIDER",
    actorId: providerCompanyId,
  });

  await syncProviderLifecycleState(providerCompanyId);
  revalidatePath("/provider/pricing");
}
