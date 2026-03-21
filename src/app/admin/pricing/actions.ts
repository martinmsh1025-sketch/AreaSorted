"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteProviderPricingRule, toggleProviderPricingRule, savePricingAreaOverride, saveProviderPricingRule } from "@/lib/pricing/prisma-pricing";
import { getPrisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function savePricingConfigAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  await saveProviderPricingRule({
    providerCompanyId: String(formData.get("providerCompanyId") || ""),
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
    actorType: "ADMIN",
  });

  revalidatePath("/admin/pricing");
}

export async function disablePricingConfigAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  await toggleProviderPricingRule({
    providerPricingRuleId: String(formData.get("providerPricingRuleId") || ""),
    actorType: "ADMIN",
  });

  revalidatePath("/admin/pricing");
}

export async function deletePricingConfigAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  await deleteProviderPricingRule({
    providerPricingRuleId: String(formData.get("providerPricingRuleId") || ""),
    actorType: "ADMIN",
  });

  revalidatePath("/admin/pricing");
}

export async function saveAreaOverrideAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  await savePricingAreaOverride({
    providerCompanyId: String(formData.get("providerCompanyId") || ""),
    categoryKey: String(formData.get("categoryKey") || ""),
    postcodePrefix: String(formData.get("postcodePrefix") || ""),
    surchargeAmount: parseNumber(formData.get("surchargeAmount"), 0),
    bookingFeeOverride: parseNumber(formData.get("bookingFeeOverride"), 0),
    commissionPercentOverride: parseNumber(formData.get("commissionPercentOverride"), 0),
    active: formData.get("active") === "on",
    actorType: "ADMIN",
  });

  revalidatePath("/admin/pricing");
}

export async function saveMarketplaceSettingAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const key = String(formData.get("key") || "");
  const value = parseNumber(formData.get("value"), 0);
  if (!key) return;

  await prisma.adminSetting.upsert({
    where: { key },
    update: { valueJson: { value } },
    create: { key, valueJson: { value } },
  });

  // If this is a booking fee save, also persist the fee mode
  const feeMode = formData.get("feeMode");
  if (key === "marketplace.booking_fee" && feeMode) {
    const modeKey = "marketplace.booking_fee_mode";
    const modeValue = String(feeMode);
    await prisma.adminSetting.upsert({
      where: { key: modeKey },
      update: { valueJson: { value: modeValue } },
      create: { key: modeKey, valueJson: { value: modeValue } },
    });
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/admin/settings");
}
