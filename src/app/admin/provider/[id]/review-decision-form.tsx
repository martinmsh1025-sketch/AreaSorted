"use client";

import { useState } from "react";
import { reviewProviderStatusAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/context";

export function ReviewDecisionForm({
  providerCompanyId,
  currentStatus,
  currentNotes,
}: {
  providerCompanyId: string;
  currentStatus: string;
  currentNotes: string;
}) {
  const t = useT();
  const defaultReviewStatus =
    currentStatus === "SUBMITTED_FOR_REVIEW" ? "UNDER_REVIEW" : currentStatus;

  const [reviewStatus, setReviewStatus] = useState(defaultReviewStatus);
  const [reviewNotes, setReviewNotes] = useState(currentNotes);

  return (
    <form action={reviewProviderStatusAction} className="space-y-4">
      <input type="hidden" name="providerCompanyId" value={providerCompanyId} />
      <div>
        <Label htmlFor="reviewStatus">{t.reviewDecision.decision}</Label>
        <select
          id="reviewStatus"
          name="reviewStatus"
          value={reviewStatus}
          onChange={(e) => setReviewStatus(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="UNDER_REVIEW">{t.reviewDecision.underReview}</option>
          <option value="CHANGES_REQUESTED">{t.reviewDecision.requestChanges}</option>
          <option value="REJECTED">{t.reviewDecision.reject}</option>
          <option value="APPROVED">{t.reviewDecision.approve}</option>
        </select>
      </div>
      <div>
        <Label htmlFor="reviewNotes">{t.reviewDecision.reviewNotes}</Label>
        <textarea
          id="reviewNotes"
          name="reviewNotes"
          rows={4}
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <FormSubmitButton
        label={t.reviewDecision.saveReviewDecision}
        pendingLabel={t.reviewDecision.saving}
        className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      />
    </form>
  );
}
