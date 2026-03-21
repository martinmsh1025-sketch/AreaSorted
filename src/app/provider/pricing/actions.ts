"use server";

import { revalidatePath } from "next/cache";
import { getProviderSession } from "@/lib/provider-auth";
import { canProviderAccessPricing } from "@/lib/providers/status";
import { saveProviderPricingRule } from "@/lib/pricing/prisma-pricing";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";
import type { Prisma } from "@prisma/client";

export type ActionResult = { success: true } | { success: false; error: string };

/** Safe session check — returns result object instead of throwing redirect */
async function getPricingSession(): Promise<
  | { ok: true; providerCompanyId: string }
  | { ok: false; error: string }
> {
  try {
    const session = await getProviderSession();
    if (!session) {
      return { ok: false, error: "Session expired. Please log in again." };
    }
    if (!canProviderAccessPricing(session.providerCompany.status)) {
      return { ok: false, error: "You cannot access pricing in your current account status." };
    }
    return { ok: true, providerCompanyId: session.providerCompany.id };
  } catch {
    return { ok: false, error: "Failed to verify session." };
  }
}

/**
 * Accept all recommended prices — saves every service with the recommended
 * midpoint rate, default uplifts, and active=true.
 *
 * Payload: JSON array of { serviceKey, categoryKey, pricingMode, hourlyPrice, pricingJson }
 */
export async function acceptAllRecommendedAction(formData: FormData): Promise<ActionResult> {
  const auth = await getPricingSession();
  if (!auth.ok) return { success: false, error: auth.error };
  const { providerCompanyId } = auth;

  const rawRules = formData.get("rules");
  if (!rawRules) return { success: false, error: "No pricing data provided." };

  type RulePayload = {
    serviceKey: string;
    categoryKey: string;
    pricingMode: string;
    hourlyPrice: number | null;
    pricingJson: Record<string, number> | null;
  };

  let rules: RulePayload[];
  try {
    rules = JSON.parse(String(rawRules));
  } catch {
    return { success: false, error: "Invalid pricing data." };
  }
  if (!Array.isArray(rules)) return { success: false, error: "Invalid pricing data." };

  try {
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
          minimumCharge: null,
          sameDayUplift: 15,
          weekendUplift: 10,
          customQuoteRequired: false,
          pricingJson,
          active: true,
          actorType: "PROVIDER",
          actorId: providerCompanyId,
        });
      })
    );

    await syncProviderLifecycleState(providerCompanyId);
    revalidatePath("/provider/pricing");
    return { success: true };
  } catch (err) {
    console.error("[acceptAllRecommendedAction] Error:", err);
    return { success: false, error: "Failed to save prices. Please try again." };
  }
}

/**
 * Save a single service price — provider tweaked the recommended price.
 *
 * Payload: JSON object { serviceKey, categoryKey, pricingMode, hourlyPrice, pricingJson, active }
 */
export async function saveSinglePriceAction(formData: FormData): Promise<ActionResult> {
  const auth = await getPricingSession();
  if (!auth.ok) return { success: false, error: auth.error };
  const { providerCompanyId } = auth;

  const rawRule = formData.get("rule");
  if (!rawRule) return { success: false, error: "No pricing data provided." };

  type RulePayload = {
    serviceKey: string;
    categoryKey: string;
    pricingMode: string;
    hourlyPrice: number | null;
    pricingJson: Record<string, number> | null;
    active: boolean;
  };

  let rule: RulePayload;
  try {
    rule = JSON.parse(String(rawRule));
  } catch {
    return { success: false, error: "Invalid pricing data." };
  }

  try {
    let pricingJson: Prisma.InputJsonValue | null = null;
    if (rule.pricingMode === "fixed_per_size" && rule.pricingJson) {
      pricingJson = rule.pricingJson;
    }

    await saveProviderPricingRule({
      providerCompanyId,
      categoryKey: rule.categoryKey,
      serviceKey: rule.serviceKey,
      pricingMode: rule.pricingMode,
      hourlyPrice: rule.pricingMode === "hourly" ? rule.hourlyPrice : null,
      flatPrice: null,
      minimumCharge: null,
      sameDayUplift: 15,
      weekendUplift: 10,
      customQuoteRequired: false,
      pricingJson,
      active: rule.active,
      actorType: "PROVIDER",
      actorId: providerCompanyId,
    });

    await syncProviderLifecycleState(providerCompanyId);
    revalidatePath("/provider/pricing");
    return { success: true };
  } catch (err) {
    console.error("[saveSinglePriceAction] Error:", err);
    return { success: false, error: "Failed to save price. Please try again." };
  }
}
