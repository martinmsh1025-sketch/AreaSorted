"use client";

import { useEffect, useState } from "react";

const supportTopics = [
  "Booking confirmation delay",
  "Payment hold or charge question",
  "Reschedule or cancellation help",
  "Provider issue or no-show",
  "Account access problem",
  "Other booking support",
];

type SupportBookingOption = {
  value: string;
  label: string;
  postcode: string;
};

export function SupportForm({ bookings = [] }: { bookings?: SupportBookingOption[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [postcode, setPostcode] = useState("");
  const [topic, setTopic] = useState(supportTopics[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [caseReference, setCaseReference] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const selected = bookings.find((item) => item.value === bookingReference);
    if (selected?.postcode) {
      setPostcode(selected.postcode);
    }
  }, [bookingReference, bookings]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    setCaseReference("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bookingReference, postcode, topic, message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to send support request.");
        return;
      }

      setSuccess(true);
      setCaseReference(typeof data.caseReference === "string" ? data.caseReference : "");
      setName("");
      setEmail("");
      setBookingReference("");
      setPostcode("");
      setTopic(supportTopics[0]);
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mini-form" onSubmit={handleSubmit}>
      <strong style={{ display: "block", marginBottom: "0.8rem" }}>Send a support request</strong>
      <div className="quote-field-grid quote-field-grid-2col">
        <label className="quote-field-stack">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        </label>
        <label className="quote-field-stack">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={160} />
        </label>
      </div>
      <div className="quote-field-grid quote-field-grid-2col" style={{ marginTop: "0.9rem" }}>
        {bookings.length > 0 ? (
          <label className="quote-field-stack">
            <span>Booking</span>
            <select value={bookingReference} onChange={(e) => setBookingReference(e.target.value)}>
              <option value="">Select a booking (optional)</option>
              {bookings.map((booking) => <option key={booking.value} value={booking.value}>{booking.label}</option>)}
            </select>
          </label>
        ) : (
          <label className="quote-field-stack">
            <span>Booking reference</span>
            <input value={bookingReference} onChange={(e) => setBookingReference(e.target.value)} placeholder="Optional" maxLength={80} />
          </label>
        )}
        <label className="quote-field-stack">
          <span>Postcode</span>
          <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Optional" maxLength={24} />
        </label>
      </div>
      <label className="quote-field-stack" style={{ marginTop: "0.9rem" }}>
        <span>Support topic</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          {supportTopics.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="quote-field-stack" style={{ marginTop: "0.9rem" }}>
        <span>Message</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required maxLength={4000} placeholder="Tell us what happened and what you need help with." />
      </label>
      {error ? <p style={{ color: "var(--color-error)", marginTop: "0.75rem", fontSize: "0.9rem" }}>{error}</p> : null}
      {success ? <p style={{ color: "var(--color-success)", marginTop: "0.75rem", fontSize: "0.9rem" }}>Support request sent. We will reply as soon as possible.{caseReference ? ` Case reference: ${caseReference}.` : ""}</p> : null}
      <div className="button-row" style={{ marginTop: "1rem" }}>
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send support request"}
        </button>
      </div>
    </form>
  );
}
