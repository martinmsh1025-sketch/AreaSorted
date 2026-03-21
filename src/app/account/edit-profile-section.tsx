"use client";

import { useState } from "react";
import { updateCustomerProfileAction } from "./actions";

type Props = {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export function EditProfileSection({ customer }: Props) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    const result = await updateCustomerProfileAction(fd);

    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setEditing(false);
      // Brief success flash
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="quote-summary-list">
          <div><span>Name</span><strong>{customer.firstName} {customer.lastName}</strong></div>
          <div><span>Email</span><strong>{customer.email}</strong></div>
          <div><span>Phone</span><strong>{customer.phone}</strong></div>
        </div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="button button-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            Edit profile
          </button>
          {success && (
            <span style={{ color: "var(--color-success, #16a34a)", fontSize: "0.85rem", fontWeight: 500 }}>
              Profile updated!
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <label className="quote-field-stack">
          <span>First name</span>
          <input type="text" name="firstName" defaultValue={customer.firstName} required />
        </label>
        <label className="quote-field-stack">
          <span>Last name</span>
          <input type="text" name="lastName" defaultValue={customer.lastName} required />
        </label>
      </div>
      <label className="quote-field-stack">
        <span>Phone</span>
        <input type="tel" name="phone" defaultValue={customer.phone} required />
      </label>
      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
        Email cannot be changed. Contact support if you need to update your email address.
      </p>

      {error && (
        <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={submitting}
          className="button button-primary"
          style={{ fontSize: "0.85rem" }}
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setError(""); }}
          disabled={submitting}
          className="button button-secondary"
          style={{ fontSize: "0.85rem" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
