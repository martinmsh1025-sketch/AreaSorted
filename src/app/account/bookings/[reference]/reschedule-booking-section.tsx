"use client";

import { useState } from "react";
import { rescheduleBookingAction } from "./actions";

/** Time slots offered for rescheduling (same as booking flow) */
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

interface RescheduleBookingSectionProps {
  bookingId: string;
  currentDate: string;   // ISO date string e.g. "2025-04-12"
  currentTime: string;   // e.g. "09:00"
}

export function RescheduleBookingSection({
  bookingId,
  currentDate,
  currentTime,
}: RescheduleBookingSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Minimum selectable date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleReschedule() {
    setError(null);
    if (!newDate || !newTime) {
      setError("Please select both a new date and time.");
      return;
    }
    setSubmitting(true);
    // H-41 FIX: Wrap server action in try/catch to prevent uncaught promise rejection
    try {
      const fd = new FormData();
      fd.set("bookingId", bookingId);
      fd.set("newDate", newDate);
      fd.set("newTime", newTime);
      const result = await rescheduleBookingAction(fd);
      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
      }
      // On success the page revalidates and re-renders
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="button button-secondary"
      >
        Reschedule
      </button>
    );
  }

  // Format current booking for display
  const currentFormatted = new Date(currentDate + "T00:00:00Z").toLocaleDateString(
    "en-GB",
    { weekday: "short", day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <div style={{
      border: "1px solid var(--color-brand, #d9252a)",
      borderRadius: 8,
      padding: "1rem",
      marginTop: "0.5rem",
    }}>
      <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: "0 0 0.25rem" }}>
        Reschedule this booking
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 0.75rem" }}>
        Currently booked for <strong>{currentFormatted}</strong> at <strong>{currentTime}</strong>.
        Choose a new date and time below.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <label className="quote-field-stack" style={{ flex: 1, minWidth: 160 }}>
          <span>New date</span>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={minDate}
            required
          />
        </label>
        <label className="quote-field-stack" style={{ flex: 1, minWidth: 160 }}>
          <span>New time</span>
          <select
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            required
          >
            <option value="">Select time</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p style={{ color: "var(--color-error, #dc2626)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={handleReschedule}
          disabled={submitting}
          className="button button-primary"
        >
          {submitting ? "Rescheduling..." : "Confirm reschedule"}
        </button>
        <button
          type="button"
          onClick={() => { setShowForm(false); setError(null); }}
          disabled={submitting}
          className="button button-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
