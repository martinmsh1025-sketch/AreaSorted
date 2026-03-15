"use client";

import { useEffect, useMemo, useState } from "react";
import { readBookingDraft, saveBookingDraft } from "@/lib/booking-draft";
import { formatCurrency, getJobTypeByValue, getPropertyTypeOption, getServiceByValue } from "@/lib/service-catalog";

type BookingDraft = {
  bookingReference?: string;
  postcode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  propertyType: string;
  service: string;
  jobType: string;
  jobSize: string;
  urgency: string;
  preferredDate: string;
  preferredTime: string;
  visits?: Array<{ date: string; time: string }>;
  bedrooms?: string;
  bathrooms?: string;
  kitchens?: string;
  areaSize?: string;
  cleaningCondition?: string;
  suppliesProvidedBy?: string;
  customerName: string;
  contactPhone: string;
  email: string;
  selectedAddOns: string[];
  additionalRequests?: string;
  entryNotes?: string;
  pricing: {
    total: number;
    subtotal: number;
    bookingFee: number;
    estimatedDurationHours: number;
    estimatedProviderPayout: number;
    estimatedPlatformMargin: number;
    serviceLabel: string;
    jobTypeLabel: string;
    coverage: { zoneLabel: string; leadTimeLabel: string };
  };
};

function formatEstimatedHours(hours: number) {
  const roundedDown = Math.max(0.5, Math.floor(hours * 2) / 2);
  return Number.isInteger(roundedDown) ? `${roundedDown.toFixed(0)} hours` : `${roundedDown.toFixed(1)} hours`;
}

function floorCurrency(value: number) {
  return Math.floor(value);
}

export default function BookingPage() {
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readBookingDraft<BookingDraft>();
    if (!saved) return;

    setDraft({
      ...saved.payload,
      bookingReference: saved.bookingReference,
    });
  }, []);

  const serviceAddress = useMemo(() => {
    if (!draft) return "";
    return [draft.addressLine1, draft.addressLine2, draft.city, draft.postcode].filter(Boolean).join(", ");
  }, [draft]);

  async function handleContinueToStripe() {
    if (!draft || isSubmitting) return;

    if (!draft.customerName || !draft.email) {
      setError("Please complete customer name and email before continuing to Stripe.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draft }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start Stripe checkout");
      }

      saveBookingDraft(draft, draft.bookingReference);
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start Stripe checkout");
      setIsSubmitting(false);
    }
  }

  if (!draft) {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="panel card">
            <h1 className="title" style={{ fontSize: "2rem" }}>No quote found yet</h1>
            <p className="lead">Start from the homepage or quote page first so we can build your booking summary.</p>
            <a className="button button-primary" href="/">Back to Home</a>
          </div>
        </div>
      </main>
    );
  }

  const service = getServiceByValue(draft.service);
  const jobType = getJobTypeByValue(draft.jobType, service.value);
  const propertyType = getPropertyTypeOption(draft.propertyType);
  const jobSize = jobType.sizeOptions.find((option) => option.value === draft.jobSize);
  const selectedAddOns = jobType.addOns.filter((item) => draft.selectedAddOns.includes(item.value));

  return (
    <main className="section">
      {isSubmitting ? (
        <div className="page-loading-overlay" role="status" aria-live="polite">
          <div className="page-loading-card">
            <span className="page-loading-spinner" />
            <strong>Loading...</strong>
            <span>Please wait...</span>
          </div>
        </div>
      ) : null}
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: "2rem" }}>
          <div className="eyebrow">Booking review</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.1rem, 4vw, 3.6rem)" }}>Review the booking before payment.</h1>
          <p className="lead">This page keeps the flow simple: review the job, review the customer details, then move into payment.</p>
        </div>

        <div className="quote-page-grid">
          <div className="quote-form-sections">
            <section className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Service</div>
                <strong>Booking summary</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Booking reference</span><strong>{draft.bookingReference || "Pending"}</strong></div>
                <div><span>Service</span><strong>{draft.pricing.serviceLabel}</strong></div>
                <div><span>Specific job</span><strong>{draft.pricing.jobTypeLabel}</strong></div>
                <div><span>Property type</span><strong>{propertyType.label}</strong></div>
                {draft.service !== "cleaning" ? <div><span>Job size</span><strong>{jobSize?.label || draft.jobSize}</strong></div> : null}
                {draft.service === "cleaning" ? <div><span>Bedrooms / bathrooms / kitchens</span><strong>{`${draft.bedrooms || 0} / ${draft.bathrooms || 0} / ${draft.kitchens || 0}`}</strong></div> : null}
                <div><span>Estimated hours</span><strong>{formatEstimatedHours(draft.pricing.estimatedDurationHours)}</strong></div>
              </div>
            </section>

            <section className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Address</div>
                <strong>Service and timing</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Service address</span><strong>{serviceAddress || "To be confirmed"}</strong></div>
                <div><span>Coverage zone</span><strong>{draft.pricing.coverage.zoneLabel}</strong></div>
                <div><span>Date</span><strong>{draft.visits?.length ? draft.visits.map((visit) => visit.date).join(", ") : draft.preferredDate || "To be confirmed"}</strong></div>
                <div><span>Time</span><strong>{draft.visits?.length ? draft.visits.map((visit) => visit.time).join(", ") : draft.preferredTime || "To be confirmed"}</strong></div>
                <div><span>Availability note</span><strong>{draft.pricing.coverage.leadTimeLabel}</strong></div>
              </div>
            </section>

            <section className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Customer</div>
                <strong>Contact details</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Customer name</span><strong>{draft.customerName || "To be confirmed"}</strong></div>
                <div><span>Phone</span><strong>{draft.contactPhone || "To be confirmed"}</strong></div>
                <div><span>Email</span><strong>{draft.email || "To be confirmed"}</strong></div>
                <div><span>Add-ons</span><strong>{selectedAddOns.length ? selectedAddOns.map((item) => item.label).join(", ") : "No add-ons selected"}</strong></div>
                <div><span>Additional requests</span><strong>{draft.additionalRequests || "None"}</strong></div>
                <div><span>Entry notes</span><strong>{draft.entryNotes || "None"}</strong></div>
              </div>
            </section>
          </div>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Payment</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Pay securely with Stripe</h2>
              <div className="quote-total-number">{formatCurrency(floorCurrency(draft.pricing.total))}</div>
              <div className="quote-summary-list">
                <div><span>Service subtotal</span><strong>{formatCurrency(floorCurrency(draft.pricing.subtotal))}</strong></div>
                <div><span>Booking fee</span><strong>{formatCurrency(floorCurrency(draft.pricing.bookingFee))}</strong></div>
                <div><span>Estimated provider payout</span><strong>{formatCurrency(floorCurrency(draft.pricing.estimatedProviderPayout))}</strong></div>
                <div><span>Estimated platform margin</span><strong>{formatCurrency(floorCurrency(draft.pricing.estimatedPlatformMargin))}</strong></div>
              </div>
              {error ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error}</p> : null}
              <div className="button-row" style={{ marginTop: "1rem" }}>
                <a className="button button-secondary" href="/instant-quote">Edit details</a>
              </div>
              <button className="button button-primary quote-summary-button" type="button" disabled={isSubmitting} onClick={handleContinueToStripe}>
                {isSubmitting ? <span className="button-spinner-wrap"><span className="button-spinner" />Redirecting to Stripe</span> : "Continue to Stripe"}
              </button>
            </section>

            <section className="panel card">
              <div className="eyebrow">Before payment</div>
              <ul className="list-clean quote-meta-list">
                <li>Review the booking details carefully before payment.</li>
                <li>Stripe will collect billing and card details securely.</li>
                <li>The booking will move into provider dispatch after payment succeeds.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
