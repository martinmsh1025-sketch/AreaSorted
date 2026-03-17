"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateProviderDocumentReview, updateProviderReview } from "@/lib/providers/repository";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";

export async function reviewProviderStatusAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const reviewStatus = String(formData.get("reviewStatus") || "") as "UNDER_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
  const reviewNotes = String(formData.get("reviewNotes") || "").trim();
  if (!providerCompanyId || !reviewStatus) return;

  await updateProviderReview({
    providerCompanyId,
    status: reviewStatus,
    reviewNotes,
  });

  await syncProviderLifecycleState(providerCompanyId);
  redirect(`/admin/provider/${providerCompanyId}?status=${reviewStatus.toLowerCase()}`);
}

export async function reviewProviderDocumentAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const documentId = String(formData.get("documentId") || "");
  const documentStatus = String(formData.get("documentStatus") || "") as "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_RESUBMISSION";
  const reviewNotes = String(formData.get("reviewNotes") || "").trim();
  if (!providerCompanyId || !documentId || !documentStatus) return;

  await updateProviderDocumentReview({
    documentId,
    status: documentStatus,
    reviewNotes,
  });

  await syncProviderLifecycleState(providerCompanyId);
  redirect(`/admin/provider/${providerCompanyId}?status=document_reviewed`);
}
