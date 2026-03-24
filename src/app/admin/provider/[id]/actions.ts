"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateProviderDocumentReview, updateProviderReview } from "@/lib/providers/repository";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";
import { deleteProviderPricingRule, toggleProviderPricingRule, savePricingAreaOverride, saveProviderPricingRule } from "@/lib/pricing/prisma-pricing";
import { getPrisma } from "@/lib/db";
import { buildProviderChecklist } from "@/server/services/providers/checklist";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function reviewProviderStatusAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const reviewStatus = String(formData.get("reviewStatus") || "") as "UNDER_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
  const reviewNotes = String(formData.get("reviewNotes") || "").trim();

  // M-19 FIX: Guard debug logging behind NODE_ENV
  if (process.env.NODE_ENV !== "production") {
    console.log("[reviewProviderStatusAction] called with:", { providerCompanyId, reviewStatus, reviewNotes });
  }

  if (!providerCompanyId || !reviewStatus) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[reviewProviderStatusAction] EARLY RETURN — missing providerCompanyId or reviewStatus");
    }
    return;
  }

  if (reviewStatus === "APPROVED") {
    const prisma = getPrisma();
    const provider = await prisma.providerCompany.findUnique({
      where: { id: providerCompanyId },
      include: {
        serviceCategories: true,
        coverageAreas: true,
        agreements: true,
        documents: true,
        pricingRules: true,
        stripeConnectedAccount: true,
      },
    });

    const checklist = buildProviderChecklist(provider);
    const requiredKeys = ["email_verified", "password_set", "profile", "categories", "coverage", "documents_uploaded", "documents_approved", "agreement"];
    const missing = checklist.items.filter((item) => requiredKeys.includes(item.key) && !item.complete);
    if (missing.length) {
      redirect(`/admin/provider/${providerCompanyId}?error=${encodeURIComponent(`Cannot approve yet. Missing: ${missing.map((item) => item.label).join(", ")}`)}`);
    }
  }

  const result = await updateProviderReview({
    providerCompanyId,
    status: reviewStatus,
    reviewNotes,
  });

  // M-19 FIX: Guard debug logging behind NODE_ENV
  if (process.env.NODE_ENV !== "production") {
    console.log("[reviewProviderStatusAction] updateProviderReview result:", { id: result.id, status: result.status, approvedAt: result.approvedAt });
  }

  // Keep admin review as the source of truth for review outcomes, but once a
  // provider is explicitly approved we should immediately reconcile their
  // operational status (APPROVED / PRICING_PENDING / STRIPE_PENDING / ACTIVE)
  // based on the current setup state. Identity-lock statuses like SUSPENDED,
  // REJECTED, and CHANGES_REQUESTED are still protected inside the sync logic.
  if (reviewStatus === "APPROVED") {
    await syncProviderLifecycleState(providerCompanyId);
  }

  redirect(`/admin/provider/${providerCompanyId}?status=${reviewStatus.toLowerCase()}`);
}

export async function reviewProviderDocumentAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const documentId = String(formData.get("documentId") || "");
  const documentStatus = String(formData.get("documentStatus") || "") as "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_RESUBMISSION";
  const reviewNotes = String(formData.get("reviewNotes") || "").trim();

  // M-19 FIX: Guard debug logging behind NODE_ENV
  if (process.env.NODE_ENV !== "production") {
    console.log("[reviewProviderDocumentAction] called with:", { providerCompanyId, documentId, documentStatus, reviewNotes });
  }

  if (!providerCompanyId || !documentId || !documentStatus) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[reviewProviderDocumentAction] EARLY RETURN — missing fields");
    }
    return;
  }

  await updateProviderDocumentReview({
    documentId,
    status: documentStatus,
    reviewNotes,
  });

  await syncProviderLifecycleState(providerCompanyId);
  redirect(`/admin/provider/${providerCompanyId}?status=document_reviewed`);
}

export async function deleteCoverageAreaAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const coverageAreaId = String(formData.get("coverageAreaId") || "");
  if (!providerCompanyId || !coverageAreaId) return;

  const prisma = getPrisma();
  await prisma.providerCoverageArea.delete({
    where: { id: coverageAreaId },
  });

  redirect(`/admin/provider/${providerCompanyId}?status=coverage_area_removed`);
}

// ── Pricing actions (scoped to provider detail page) ──

export async function providerSavePricingConfigAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");

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
    actorType: "ADMIN",
  });

  revalidatePath(`/admin/provider/${providerCompanyId}`);
  revalidatePath("/admin/pricing");
}

export async function providerDisablePricingConfigAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const ruleId = String(formData.get("providerPricingRuleId") || "");

  const prisma = getPrisma();
  const rule = await prisma.providerPricingRule.findUnique({ where: { id: ruleId } });

  await toggleProviderPricingRule({
    providerPricingRuleId: ruleId,
    actorType: "ADMIN",
  });

  if (rule) {
    revalidatePath(`/admin/provider/${rule.providerCompanyId}`);
  }
  revalidatePath("/admin/pricing");
}

export async function providerDeletePricingConfigAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const ruleId = String(formData.get("providerPricingRuleId") || "");

  const prisma = getPrisma();
  const rule = await prisma.providerPricingRule.findUnique({ where: { id: ruleId } });
  const companyId = rule?.providerCompanyId;

  await deleteProviderPricingRule({
    providerPricingRuleId: ruleId,
    actorType: "ADMIN",
  });

  if (companyId) {
    revalidatePath(`/admin/provider/${companyId}`);
  }
  revalidatePath("/admin/pricing");
}

export async function providerSaveAreaOverrideAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");

  await savePricingAreaOverride({
    providerCompanyId,
    categoryKey: String(formData.get("categoryKey") || ""),
    postcodePrefix: String(formData.get("postcodePrefix") || ""),
    surchargeAmount: parseNumber(formData.get("surchargeAmount"), 0),
    bookingFeeOverride: parseNumber(formData.get("bookingFeeOverride"), 0),
    commissionPercentOverride: parseNumber(formData.get("commissionPercentOverride"), 0),
    active: formData.get("active") === "on",
    actorType: "ADMIN",
  });

  revalidatePath(`/admin/provider/${providerCompanyId}`);
  revalidatePath("/admin/pricing");
}
