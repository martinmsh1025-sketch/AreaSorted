"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateProviderDocumentReview, updateProviderReview } from "@/lib/providers/repository";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";
import { getPrisma } from "@/lib/db";

export async function reviewProviderStatusAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const reviewStatus = String(formData.get("reviewStatus") || "") as "UNDER_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
  const reviewNotes = String(formData.get("reviewNotes") || "").trim();

  console.log("[reviewProviderStatusAction] called with:", { providerCompanyId, reviewStatus, reviewNotes });

  if (!providerCompanyId || !reviewStatus) {
    console.log("[reviewProviderStatusAction] EARLY RETURN — missing providerCompanyId or reviewStatus");
    return;
  }

  const result = await updateProviderReview({
    providerCompanyId,
    status: reviewStatus,
    reviewNotes,
  });

  console.log("[reviewProviderStatusAction] updateProviderReview result:", { id: result.id, status: result.status, approvedAt: result.approvedAt });

  // Do NOT call syncProviderLifecycleState() here — admin review is an explicit
  // decision, not an automated lifecycle transition. The sync function has
  // identity locks that can interfere with the admin's intended status change.

  redirect(`/admin/provider/${providerCompanyId}?status=${reviewStatus.toLowerCase()}`);
}

export async function reviewProviderDocumentAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const documentId = String(formData.get("documentId") || "");
  const documentStatus = String(formData.get("documentStatus") || "") as "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_RESUBMISSION";
  const reviewNotes = String(formData.get("reviewNotes") || "").trim();

  console.log("[reviewProviderDocumentAction] called with:", { providerCompanyId, documentId, documentStatus, reviewNotes });

  if (!providerCompanyId || !documentId || !documentStatus) {
    console.log("[reviewProviderDocumentAction] EARLY RETURN — missing fields");
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
