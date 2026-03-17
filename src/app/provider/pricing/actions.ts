"use server";

import { redirect } from "next/navigation";
import { requireProviderPricingAccess } from "@/lib/provider-auth";
import { deleteProviderPricingRule, disableProviderPricingRule, savePricingAreaOverride, saveProviderPricingRule } from "@/lib/pricing/prisma-pricing";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function saveProviderPricingAction(formData: FormData) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;

  await saveProviderPricingRule({
    providerCompanyId,
    categoryKey: String(formData.get("categoryKey") || ""),
    serviceKey: String(formData.get("serviceKey") || ""),
    pricingMode: String(formData.get("pricingMode") || "flat"),
    flatPrice: parseNumber(formData.get("flatPrice"), 0),
    hourlyPrice: parseNumber(formData.get("hourlyPrice"), 0),
    minimumCharge: parseNumber(formData.get("minimumCharge"), 0),
    travelFee: parseNumber(formData.get("travelFee"), 0),
    sameDayUplift: parseNumber(formData.get("sameDayUplift"), 0),
    weekendUplift: parseNumber(formData.get("weekendUplift"), 0),
    customQuoteRequired: formData.get("customQuoteRequired") === "on",
    active: formData.get("active") === "on",
    actorType: "PROVIDER",
    actorId: providerCompanyId,
  });

  await syncProviderLifecycleState(providerCompanyId);
}

export async function disableProviderPricingAction(formData: FormData) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;

  await disableProviderPricingRule({
    providerPricingRuleId: String(formData.get("providerPricingRuleId") || ""),
    actorType: "PROVIDER",
    actorId: providerCompanyId,
  });

  await syncProviderLifecycleState(providerCompanyId);
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
}

export async function saveProviderAreaOverrideAction(formData: FormData) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;

  await savePricingAreaOverride({
    providerCompanyId,
    categoryKey: String(formData.get("categoryKey") || ""),
    postcodePrefix: String(formData.get("postcodePrefix") || ""),
    surchargeAmount: parseNumber(formData.get("surchargeAmount"), 0),
    bookingFeeOverride: parseNumber(formData.get("bookingFeeOverride"), 0),
    commissionPercentOverride: parseNumber(formData.get("commissionPercentOverride"), 0),
    active: formData.get("active") === "on",
    actorType: "PROVIDER",
    actorId: providerCompanyId,
  });

  redirect("/provider/pricing?status=saved");
}
