"use client";

import { useState } from "react";
import { cancelBookingAction } from "./actions";

export function CancelBookingSection({ bookingId }: { bookingId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("bookingId", bookingId);
    fd.set("reason", reason);
    const result = await cancelBookingAction(fd);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="button button-secondary"
        style={{ color: "var(--color-error, #dc2626)" }}
      >
        Cancel this booking
      </button>
    );
  }

  return (
    <div style={{
      border: "1px solid var(--color-error, #dc2626)",
      borderRadius: 8,
      padding: "1rem",
      marginTop: "0.5rem",
    }}>
      <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: "0 0 0.5rem", color: "var(--color-error, #dc2626)" }}>
        Are you sure you want to cancel?
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 0.75rem" }}>
        This action cannot be undone. If you have already paid, you may be eligible for a refund depending on our cancellation policy.
      </p>
      <label className="quote-field-stack" style={{ marginBottom: "0.75rem" }}>
        <span>Reason (optional)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please let us know why you're cancelling..."
          rows={2}
          style={{ resize: "vertical" }}
        />
      </label>
      {error && (
        <p style={{ color: "var(--color-error, #dc2626)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="button button-primary"
          style={{ background: "var(--color-error, #dc2626)" }}
        >
          {submitting ? "Cancelling..." : "Yes, cancel booking"}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={submitting}
          className="button button-secondary"
        >
          Keep booking
        </button>
      </div>
    </div>
  );
}
