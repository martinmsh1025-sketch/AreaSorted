"use server";

import { revalidatePath } from "next/cache";
import { updateCleanerApplicationReview } from "@/lib/cleaner-application-store";

export async function reviewCleanerApplicationAction(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "");
  const status = String(formData.get("status") || "submitted") as
    | "submitted"
    | "under_review"
    | "more_info_required"
    | "approved"
    | "rejected";
  const internalReason = String(formData.get("internalReason") || "");
  const externalMessage = String(formData.get("externalMessage") || "");

  if (!applicationId || !internalReason) return;

  await updateCleanerApplicationReview(applicationId, {
    status,
    internalReason,
    externalMessage,
  });

  revalidatePath("/admin/cleaner-applications");
  revalidatePath(`/admin/cleaner-applications/${applicationId}`);
  revalidatePath("/admin/cleaners");
}
