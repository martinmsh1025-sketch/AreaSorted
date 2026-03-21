"use client";

import { useState, useTransition } from "react";
import {
  acceptCounterOfferAction,
  rejectCounterOfferAction,
} from "@/app/account/bookings/[reference]/actions";

interface CounterOfferData {
  id: string;
  proposedPrice: number | null;
  proposedDate: string | null;
  proposedStartTime: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

function money(v: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);
}

export function CustomerCounterOfferBanner({
  offers,
  providerName,
}: {
  offers: CounterOfferData[];
  providerName: string;
}) {
  const pendingOffers = offers.filter((o) => o.status === "PENDING");
  const pastOffers = offers.filter((o) => o.status !== "PENDING");

  if (offers.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {pendingOffers.map((offer) => (
        <PendingOfferCard key={offer.id} offer={offer} providerName={providerName} />
      ))}
      {pastOffers.length > 0 && (
        <div className="panel card" style={{ marginBottom: "0" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            Previous offers
          </h2>
          {pastOffers.map((offer) => (
            <PastOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingOfferCard({
  offer,
  providerName,
}: {
  offer: CounterOfferData;
  providerName: string;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    const fd = new FormData();
    fd.set("counterOfferId", offer.id);
    startTransition(async () => {
      const result = await acceptCounterOfferAction(fd);
      if (result?.error) setError(result.error);
    });
  }

  function handleReject() {
    setError(null);
    const fd = new FormData();
    fd.set("counterOfferId", offer.id);
    if (reason.trim()) fd.set("reason", reason.trim());
    startTransition(async () => {
      const result = await rejectCounterOfferAction(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div
      className="panel card"
      style={{
        marginBottom: 0,
        border: "2px solid var(--color-brand, #d9252a)",
        background: "linear-gradient(135deg, #fef3f3 0%, #fff 100%)",
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "var(--color-brand, #d9252a)",
          color: "#fff",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "0.2rem 0.6rem",
          borderRadius: "0.25rem",
          marginBottom: "0.75rem",
        }}
      >
        Action required
      </div>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
        {providerName} has proposed a change
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
        {offer.proposedPrice != null && (
          <div style={{ fontSize: "0.95rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>New price: </span>
            <strong>{money(offer.proposedPrice)}</strong>
          </div>
        )}
        {offer.proposedDate && (
          <div style={{ fontSize: "0.95rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>New date: </span>
            <strong>
              {new Date(offer.proposedDate).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
          </div>
        )}
        {offer.proposedStartTime && (
          <div style={{ fontSize: "0.95rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>New start time: </span>
            <strong>{offer.proposedStartTime}</strong>
          </div>
        )}
      </div>

      {offer.message && (
        <div
          style={{
            background: "var(--color-surface, #f8f8f8)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            fontStyle: "italic",
            color: "var(--color-text-muted)",
            marginBottom: "1rem",
            borderLeft: "3px solid var(--color-border)",
          }}
        >
          &ldquo;{offer.message}&rdquo;
        </div>
      )}

      {error && (
        <p style={{ color: "var(--color-error, #dc2626)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          {error}
        </p>
      )}

      {!showRejectForm ? (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleAccept}
            disabled={pending}
            className="button button-primary"
            style={{ minWidth: 140 }}
          >
            {pending ? "Processing..." : "Accept offer"}
          </button>
          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={pending}
            className="button button-secondary"
            style={{ minWidth: 140 }}
          >
            Decline offer
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label
              htmlFor={`reject-reason-${offer.id}`}
              style={{ fontSize: "0.85rem", fontWeight: 500, display: "block", marginBottom: "0.3rem" }}
            >
              Reason for declining (optional)
            </label>
            <textarea
              id={`reject-reason-${offer.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. I'd prefer to keep the original date..."
              rows={2}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid var(--color-border)",
                borderRadius: "0.375rem",
                fontSize: "0.9rem",
                resize: "vertical",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleReject}
              disabled={pending}
              className="button"
              style={{
                minWidth: 140,
                background: "var(--color-error, #dc2626)",
                color: "#fff",
                border: "none",
              }}
            >
              {pending ? "Processing..." : "Confirm decline"}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              disabled={pending}
              className="button button-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.75rem" }}>
        If you decline, your original booking terms remain unchanged.
      </p>
    </div>
  );
}

function PastOfferCard({ offer }: { offer: CounterOfferData }) {
  const statusLabels: Record<string, string> = {
    ACCEPTED: "Accepted",
    REJECTED: "Declined",
    WITHDRAWN: "Withdrawn by provider",
    EXPIRED: "Expired",
  };

  const statusColors: Record<string, string> = {
    ACCEPTED: "var(--color-success, #16a34a)",
    REJECTED: "var(--color-error, #dc2626)",
    WITHDRAWN: "var(--color-text-muted)",
    EXPIRED: "var(--color-text-muted)",
  };

  return (
    <div
      style={{
        padding: "0.75rem 0",
        borderBottom: "1px solid var(--color-border)",
        fontSize: "0.9rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {offer.proposedPrice != null && (
            <span>Price: <strong>{money(offer.proposedPrice)}</strong></span>
          )}
          {offer.proposedDate && (
            <span>
              Date: <strong>
                {new Date(offer.proposedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </strong>
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: statusColors[offer.status] ?? "var(--color-text-muted)",
          }}
        >
          {statusLabels[offer.status] ?? offer.status}
        </span>
      </div>
    </div>
  );
}
