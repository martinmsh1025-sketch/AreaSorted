"use client";

import { useEffect, useMemo, useState } from "react";
import { readBookingDraft } from "@/lib/booking-draft";

type PaymentDraft = {
  bookingReference?: string;
  customerName: string;
  email: string;
  contactPhone: string;
  service: string;
  postcode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  estimatedHours: number;
  preferredDate: string;
  selectedDates?: string[];
  visits?: Array<{ date: string; time: string }>;
  preferredTime: string;
  supplies: string;
  pets: string;
  additionalRequests: string;
  entryNotes: string;
  parkingNotes: string;
  billingSameAsService: boolean;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingPostcode: string;
  oven: boolean;
  fridge: boolean;
  windows: boolean;
  ironing: boolean;
  eco: boolean;
  pricing: {
    total: number;
    dateCount?: number;
    perVisitBaseAmount?: number;
    baseAmount: number;
    addOns: number;
    weekendSurcharge: number;
    eveningSurcharge: number;
    urgentSurcharge: number;
  };
};

function formatGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PaymentPage() {
  const [draft, setDraft] = useState<PaymentDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readBookingDraft<PaymentDraft>();
    if (!saved) return;

    setDraft({
      ...saved.payload,
      bookingReference: saved.bookingReference,
    });
  }, []);

  const paymentReady = useMemo(() => Boolean(draft?.customerName && draft?.email), [draft]);

  const serviceAddress = useMemo(() => {
    if (!draft) return "";
    return [draft.addressLine1, draft.addressLine2, draft.city, draft.postcode].filter(Boolean).join(", ");
  }, [draft]);

  const billingAddress = useMemo(() => {
    if (!draft) return "";
    return [draft.billingAddressLine1, draft.billingAddressLine2, draft.billingCity, draft.billingPostcode].filter(Boolean).join(", ");
  }, [draft]);

  const selectedAddOns = useMemo(() => {
    if (!draft) return [];
    return [
      draft.oven ? "Oven" : null,
      draft.fridge ? "Fridge" : null,
      draft.windows ? "Inside windows" : null,
      draft.ironing ? "Ironing" : null,
      draft.eco ? "Eco products" : null,
    ].filter(Boolean) as string[];
  }, [draft]);

  async function handleStripeCheckout() {
    if (!draft || isSubmitting) return;

    if (!paymentReady) {
      setError("Please complete customer name and email on the quote step before continuing to Stripe.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
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
            <h1 className="title" style={{ fontSize: "2rem" }}>No booking review found</h1>
            <p className="lead">Please complete the quote and booking review steps first.</p>
            <a className="button button-primary" href="/">Back to Home</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: "2rem" }}>
          <div className="eyebrow">Payment</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.1rem, 4vw, 3.6rem)" }}>Payment step placeholder</h1>
          <p className="lead">This is the next connected step. Stripe checkout will be attached here next.</p>
        </div>

        <div className="quote-page-grid">
          <section className="quote-form-sections">
            <div className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Customer</div>
                <strong>Payment contact</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Booking reference</span><strong>{draft.bookingReference || "Pending"}</strong></div>
                <div><span>Name</span><strong>{draft.customerName || "To be confirmed"}</strong></div>
                <div><span>Email</span><strong>{draft.email || "To be confirmed"}</strong></div>
                <div><span>Phone</span><strong>{draft.contactPhone || "To be confirmed"}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Service</div>
                <strong>Booking snapshot</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Service</span><strong>{formatLabel(draft.service)}</strong></div>
                <div><span>Cleaning address</span><strong>{serviceAddress || "To be confirmed"}</strong></div>
                <div><span>Property type</span><strong>{formatLabel(draft.propertyType)}</strong></div>
                <div><span>Bedrooms</span><strong>{draft.bedrooms}</strong></div>
                <div><span>Bathrooms</span><strong>{draft.bathrooms}</strong></div>
                <div><span>Kitchens</span><strong>{draft.kitchens}</strong></div>
                <div><span>Estimated hours</span><strong>{draft.estimatedHours} hours</strong></div>
                <div>
                  <span>Selected visits</span>
                  <strong>
                    {draft.visits?.length
                      ? draft.visits.map((visit) => `${visit.date} ${visit.time}`).join(", ")
                      : draft.selectedDates?.length
                        ? draft.selectedDates.join(", ")
                        : draft.preferredDate || "To be confirmed"}
                  </strong>
                </div>
                <div><span>Supplies</span><strong>{draft.supplies === "cleaner" ? "Cleaner brings supplies" : "Customer provides supplies"}</strong></div>
                <div><span>Pets</span><strong>{draft.pets === "yes" ? "Pets at property" : "No pets"}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Billing</div>
                <strong>Billing and special notes</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Billing address</span><strong>{billingAddress || "Same as cleaning address"}</strong></div>
                <div><span>Add-ons</span><strong>{selectedAddOns.length ? selectedAddOns.join(", ") : "No add-ons selected"}</strong></div>
                <div><span>Additional requests</span><strong>{draft.additionalRequests || "None"}</strong></div>
                <div><span>Entry notes</span><strong>{draft.entryNotes || "None"}</strong></div>
                <div><span>Parking notes</span><strong>{draft.parkingNotes || "None"}</strong></div>
              </div>
            </div>
          </section>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Total due</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Ready for Stripe</h2>
              <div className="quote-total-number">{formatGBP(draft.pricing.total)}</div>
              <div className="quote-summary-list">
                <div><span>Per visit</span><strong>{formatGBP(draft.pricing.perVisitBaseAmount || 0)}</strong></div>
                <div><span>Selected dates</span><strong>{draft.pricing.dateCount || draft.selectedDates?.length || 1}</strong></div>
                <div><span>Base amount</span><strong>{formatGBP(draft.pricing.baseAmount)}</strong></div>
                <div><span>Add-ons</span><strong>{formatGBP(draft.pricing.addOns)}</strong></div>
                <div><span>Weekend surcharge</span><strong>{formatGBP(draft.pricing.weekendSurcharge)}</strong></div>
                <div><span>Evening surcharge</span><strong>{formatGBP(draft.pricing.eveningSurcharge)}</strong></div>
                <div><span>Urgent booking surcharge</span><strong>{formatGBP(draft.pricing.urgentSurcharge)}</strong></div>
              </div>
              {!paymentReady ? (
                <p style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  Add customer name and email on the previous step before payment can start.
                </p>
              ) : null}
              {error ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error}</p> : null}
              <button className="button button-primary quote-summary-button" type="button" disabled={isSubmitting} onClick={handleStripeCheckout}>
                {isSubmitting ? "Redirecting to Stripe..." : "Continue to Stripe"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
