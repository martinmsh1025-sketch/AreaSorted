"use client";

import { useFormState, useFormStatus } from "react-dom";
import { reportBookingIssueAction, type ReportBookingIssueState } from "./actions";

const initialState: ReportBookingIssueState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button button-secondary" disabled={pending}>
      {pending ? "Sending..." : "Report issue"}
    </button>
  );
}

export function ReportBookingIssueSection({ bookingId }: { bookingId: string }) {
  const [state, formAction] = useFormState(reportBookingIssueAction, initialState);

  return (
    <div id="report-booking-issue" className="panel card" style={{ marginTop: "1.5rem" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Need help with this booking?</h2>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 0.9rem", lineHeight: 1.6 }}>
        If the provider was late, missed agreed tasks, caused damage, or the visit did not go as expected, send the details here. AreaSorted will log the case for review and contact you if more evidence is needed.
      </p>
      <form action={formAction} style={{ display: "grid", gap: "0.85rem" }}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <label className="quote-field-stack">
          <span>Issue type</span>
          <select name="complaintType" defaultValue="POOR_QUALITY">
            <option value="POOR_QUALITY">Poor quality</option>
            <option value="LATE_ARRIVAL">Late arrival</option>
            <option value="MISSED_TASKS">Missed tasks</option>
            <option value="DAMAGE_CLAIM">Damage claim</option>
            <option value="NO_SHOW">No show</option>
            <option value="INAPPROPRIATE_BEHAVIOUR">Inappropriate behaviour</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="quote-field-stack">
          <span>What happened?</span>
          <textarea
            name="description"
            rows={5}
            placeholder="Tell us what happened, when it happened, and what outcome you are looking for."
            style={{ resize: "vertical", minHeight: 120 }}
          />
        </label>
        <label className="quote-field-stack">
          <span>Evidence (optional)</span>
          <input name="evidence" type="file" accept=".pdf,image/png,image/jpeg" multiple />
          <small style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Upload up to 5 photos or PDFs, 10MB each, 20MB total.</small>
        </label>
        {state.error ? (
          <p style={{ margin: 0, color: "var(--color-error)", fontSize: "0.85rem" }}>{state.error}</p>
        ) : null}
        {state.success ? (
          <p style={{ margin: 0, color: "var(--color-brand)", fontSize: "0.85rem", fontWeight: 600 }}>{state.success}</p>
        ) : null}
        <div className="button-row" style={{ justifyContent: "flex-start" }}>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
