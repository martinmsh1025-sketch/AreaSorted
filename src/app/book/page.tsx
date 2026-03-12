"use client";

import { useEffect, useMemo, useState } from "react";
import { readBookingDraft, saveBookingDraft } from "@/lib/booking-draft";

type BookingDraft = {
  bookingReference?: string;
  postcode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  service: string;
  estimatedHours: number;
  preferredDate: string;
  preferredTime: string;
  frequency: string;
  supplies: string;
  customerName: string;
  contactPhone: string;
  email: string;
  pets?: string;
  additionalRequests?: string;
  entryNotes?: string;
  parkingNotes?: string;
  oven?: boolean;
  fridge?: boolean;
  windows?: boolean;
  ironing?: boolean;
  eco?: boolean;
  billingSameAsService: boolean;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingPostcode: string;
  pricing: {
    hourlyRate: number;
    baseAmount: number;
    addOns: number;
    weekendSurcharge: number;
    eveningSurcharge: number;
    urgentSurcharge: number;
    recurringDiscount: number;
    total: number;
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

  async function handleContinueToStripe() {
    if (!draft || isSubmitting) return;

    if (!draft.customerName || !draft.email) {
      setError("Please complete customer name and email before continuing to Stripe.");
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

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: "2rem" }}>
          <div className="eyebrow">Booking review</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.1rem, 4vw, 3.6rem)" }}>Review the booking before payment.</h1>
          <p className="lead">This page keeps the flow simple: review the job, review the customer and billing details, then move into payment.</p>
        </div>

        <div className="quote-page-grid">
          <div className="quote-form-sections">
            <section className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Service</div>
                <strong>Cleaning summary</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Booking reference</span><strong>{draft.bookingReference || "Pending"}</strong></div>
                <div><span>Service</span><strong>{formatLabel(draft.service)}</strong></div>
                <div><span>Property type</span><strong>{formatLabel(draft.propertyType)}</strong></div>
                <div><span>Bedrooms</span><strong>{draft.bedrooms}</strong></div>
                <div><span>Bathrooms</span><strong>{draft.bathrooms}</strong></div>
                <div><span>Kitchens</span><strong>{draft.kitchens}</strong></div>
                <div><span>Estimated hours</span><strong>{draft.estimatedHours} hours</strong></div>
                <div><span>Frequency</span><strong>{formatLabel(draft.frequency)}</strong></div>
                <div><span>Supplies</span><strong>{draft.supplies === "cleaner" ? "Cleaner brings supplies" : "Customer provides supplies"}</strong></div>
              </div>
            </section>

            {draft.estimatedHours > 6 ? (
              <section className="panel card quote-section-card">
                <div className="quote-section-head">
                  <div className="eyebrow">Operations note</div>
                  <strong>Large booking</strong>
                </div>
                <p className="lead" style={{ fontSize: "1rem", margin: 0 }}>
                  Because this booking is over 6 hours, WashHub may assign more than one cleaner to help complete the service more efficiently.
                </p>
              </section>
            ) : null}

            <section className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Address</div>
                <strong>Service and timing</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Cleaning address</span><strong>{serviceAddress || "To be confirmed"}</strong></div>
                <div><span>Preferred date</span><strong>{draft.preferredDate || "To be confirmed"}</strong></div>
                <div><span>Preferred time</span><strong>{draft.preferredTime || "To be confirmed"}</strong></div>
                <div><span>Pets</span><strong>{draft.pets === "yes" ? "Pets at property" : "No pets"}</strong></div>
              </div>
            </section>

            <section className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Customer</div>
                <strong>Contact and billing</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Customer name</span><strong>{draft.customerName || "To be confirmed"}</strong></div>
                <div><span>Phone</span><strong>{draft.contactPhone || "To be confirmed"}</strong></div>
                <div><span>Email</span><strong>{draft.email || "To be confirmed"}</strong></div>
                <div><span>Billing address</span><strong>{billingAddress || "Same as service address"}</strong></div>
                <div><span>Add-ons</span><strong>{selectedAddOns.length ? selectedAddOns.join(", ") : "No add-ons selected"}</strong></div>
                <div><span>Additional requests</span><strong>{draft.additionalRequests || "None"}</strong></div>
                <div><span>Entry notes</span><strong>{draft.entryNotes || "None"}</strong></div>
                <div><span>Parking notes</span><strong>{draft.parkingNotes || "None"}</strong></div>
              </div>
            </section>
          </div>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Payment</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Pay securely with Stripe</h2>
              <div className="quote-total-number">{formatGBP(draft.pricing.total)}</div>
              <div className="quote-summary-list">
                <div><span>Base amount</span><strong>{formatGBP(draft.pricing.baseAmount)}</strong></div>
                <div><span>Add-ons</span><strong>{formatGBP(draft.pricing.addOns)}</strong></div>
                <div><span>Weekend surcharge</span><strong>{formatGBP(draft.pricing.weekendSurcharge)}</strong></div>
                <div><span>Evening surcharge</span><strong>{formatGBP(draft.pricing.eveningSurcharge)}</strong></div>
                <div><span>Urgent booking surcharge</span><strong>{formatGBP(draft.pricing.urgentSurcharge)}</strong></div>
                <div><span>Recurring discount</span><strong>-{formatGBP(draft.pricing.recurringDiscount)}</strong></div>
              </div>
              {error ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error}</p> : null}
              <button className="button button-primary quote-summary-button" type="button" disabled={isSubmitting} onClick={handleContinueToStripe}>
                {isSubmitting ? "Redirecting to Stripe..." : "Continue to Stripe"}
              </button>
            </section>

            <section className="panel card">
              <div className="eyebrow">Before payment</div>
              <ul className="list-clean quote-meta-list">
                <li>Review the booking details carefully before payment.</li>
                <li>Stripe will collect billing and card details securely.</li>
                <li>Billing stays the same as the service address unless the customer changes it.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
