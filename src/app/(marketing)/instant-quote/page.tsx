"use client";

import { useState } from "react";

const serviceOptions = [
  { value: "regular-home-cleaning", label: "Regular Cleaning" },
  { value: "deep-cleaning", label: "Deep Cleaning" },
  { value: "office-cleaning", label: "Office Cleaning" },
  { value: "airbnb-turnover-cleaning", label: "Airbnb Turnover Cleaning" },
];

function splitAddressParts(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    line1: parts[0] ?? "",
    line2: parts[1] ?? "",
    city: parts[2] ?? "",
  };
}

type InstantQuotePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InstantQuotePage({ searchParams }: InstantQuotePageProps) {
  const params = (await searchParams) ?? {};
  const postcode = typeof params.postcode === "string" ? params.postcode : "";
  const address = typeof params.address === "string" ? params.address : "";
  const service = typeof params.service === "string" ? params.service : "";
  const addressParts = splitAddressParts(address);

  return (
    <InstantQuoteForm
      initialPostcode={postcode}
      initialAddressLine1={addressParts.line1}
      initialAddressLine2={addressParts.line2}
      initialCity={addressParts.city}
      initialService={service}
    />
  );
}

type InstantQuoteFormProps = {
  initialPostcode: string;
  initialAddressLine1: string;
  initialAddressLine2: string;
  initialCity: string;
  initialService: string;
};

function InstantQuoteForm({ initialPostcode, initialAddressLine1, initialAddressLine2, initialCity, initialService }: InstantQuoteFormProps) {
  const [postcode, setPostcode] = useState(initialPostcode);
  const [addressLine1, setAddressLine1] = useState(initialAddressLine1);
  const [addressLine2, setAddressLine2] = useState(initialAddressLine2);
  const [city, setCity] = useState(initialCity);
  const [service, setService] = useState(initialService);

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: "2rem" }}>
          <div className="eyebrow">Instant quote</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.2rem, 4vw, 4rem)" }}>Get your cleaning quote in minutes.</h1>
          <p className="lead">Transparent pricing, verified cleaners, secure booking, and support if plans change.</p>
        </div>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <form className="panel mini-form">
            <strong>Address</strong>
            <input placeholder="Postcode" value={postcode} onChange={(event) => setPostcode(event.target.value)} />
            <input placeholder="Address line 1" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
            <input placeholder="Address line 2" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
            <input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
            <strong style={{ marginTop: "0.8rem" }}>Property details</strong>
            <select defaultValue="">
              <option value="" disabled>Property type</option>
              <option>Flat</option>
              <option>House</option>
              <option>Office</option>
            </select>
            <input placeholder="Bedrooms" />
            <input placeholder="Bathrooms" />
            <input placeholder="Estimated hours" />
            <strong style={{ marginTop: "0.8rem" }}>Service</strong>
            <select value={service} onChange={(event) => setService(event.target.value)}>
              <option value="" disabled>Service type</option>
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select defaultValue="">
              <option value="" disabled>Who provides supplies?</option>
              <option>Customer provides supplies</option>
              <option>Cleaner brings supplies</option>
            </select>
            <textarea placeholder="Additional requests" rows={4} />
            <button className="button button-primary" type="button">Continue to Booking</button>
          </form>
          <aside className="panel card">
            <div className="eyebrow">Quote summary</div>
            <h2 className="title" style={{ marginTop: "0.6rem", fontSize: "2rem" }}>Estimated total</h2>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-display)", margin: "1rem 0" }}>GBP 96.00</div>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>Base service amount</li>
              <li>Add-ons and surcharges shown before checkout</li>
              <li>Secure payment with Stripe</li>
              <li>One reschedule allowed if more than 48 hours before start</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
