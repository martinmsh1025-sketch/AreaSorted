"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmBookingCompletedAction } from "./actions";

export function ConfirmCompletedSection({ bookingId, deadlineLabel }: { bookingId: string; deadlineLabel: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("bookingId", bookingId);
      const result = await confirmBookingCompletedAction(formData);
      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="panel card" style={{ marginBottom: "1.5rem", border: "1px solid rgba(22, 163, 74, 0.24)", background: "linear-gradient(135deg, rgba(240,253,244,0.96) 0%, #fff 100%)" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Check the finished service</h2>
      <p style={{ margin: "0 0 0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        Your provider says the job is finished. If everything looks right, confirm it here so AreaSorted can close the booking and release provider payout. If something is wrong, report it before {deadlineLabel}. If you do nothing, we will auto-confirm after that deadline.
      </p>
      {error ? <p style={{ margin: "0 0 0.75rem", color: "var(--color-error)", fontSize: "0.85rem" }}>{error}</p> : null}
      <div className="button-row" style={{ justifyContent: "flex-start" }}>
        <button type="button" onClick={handleConfirm} disabled={submitting} className="button button-primary">
          {submitting ? "Confirming..." : "Yes, the job is complete"}
        </button>
        <a href="#report-booking-issue" className="button button-secondary">Something is wrong</a>
      </div>
    </div>
  );
}
