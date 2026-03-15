"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { upsertPricingConfig } from "@/lib/pricing-config-store";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function savePricingConfigAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  await upsertPricingConfig({
    jobType: String(formData.get("jobType") || ""),
    providerBasePrice: parseNumber(formData.get("providerBasePrice")),
    markupPercent: parseNumber(formData.get("markupPercent")),
    markupFixed: parseNumber(formData.get("markupFixed")),
    bookingFee: parseNumber(formData.get("bookingFee")),
    adminOverridePrice: parseNumber(formData.get("adminOverridePrice")),
    active: formData.get("active") === "on",
  });
}
