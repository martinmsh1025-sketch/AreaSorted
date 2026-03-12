"use client";

import { useEffect, useState } from "react";

type AddressResult = {
  ID: string;
  Line: string;
};

export default function HomePage() {
  const [service, setService] = useState("");
  const [postcode, setPostcode] = useState("");
  const [addressId, setAddressId] = useState("");
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const selectedAddress = addresses.find((item) => item.ID === addressId);
  const continueHref = `/instant-quote?${new URLSearchParams({
    postcode,
    service,
    address: selectedAddress?.Line ?? "",
  }).toString()}`;

  useEffect(() => {
    const cleanedPostcode = postcode.trim();

    if (cleanedPostcode.length < 5) {
      setAddresses([]);
      setAddressId("");
      setLookupMessage("");
      setIsLoadingAddresses(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void lookupAddresses(cleanedPostcode);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [postcode]);

  async function lookupAddresses(nextPostcode: string) {
    const cleanedPostcode = nextPostcode.trim();

    if (!cleanedPostcode) {
      setAddresses([]);
      setAddressId("");
      setLookupMessage("");
      return;
    }

    setIsLoadingAddresses(true);
    setLookupMessage("");

    try {
      const response = await fetch(`/api/postcode-search?query=${encodeURIComponent(cleanedPostcode)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to find addresses for that postcode.");
      }

      setAddresses(data.results ?? []);
      setAddressId("");
      setLookupMessage(data.results?.length ? data.instructionsTxt || "Select your address." : "No addresses found for that postcode.");
    } catch (error) {
      setAddresses([]);
      setAddressId("");
      setLookupMessage(error instanceof Error ? error.message : "Unable to find addresses for that postcode.");
    } finally {
      setIsLoadingAddresses(false);
    }
  }

  return (
    <main className="hero-minimal">
      <div className="hero-minimal-card">
        <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            Clean booking starts with one postcode.
          </h1>
          <p style={{ margin: "0.75rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.7, fontSize: "1.02rem" }}>
            Choose the service first. We will ask for the rest on the next step.
          </p>
        </div>
        <form
          className="panel mini-form hero-minimal-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            placeholder="Postcode"
            aria-label="Postcode"
            value={postcode}
            onChange={(event) => setPostcode(event.target.value.toUpperCase())}
          />
          {addresses.length ? (
            <div className="minimal-select-wrap">
              <select
                value={addressId}
                onChange={(event) => setAddressId(event.target.value)}
                aria-label="Address"
                className={`minimal-select ${addressId ? "has-value" : ""}`}
              >
                <option value="" disabled>
                  Select address
                </option>
                {addresses.map((address) => (
                  <option key={address.ID} value={address.ID}>
                    {address.Line}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {postcode ? (
            <p className="hero-minimal-note">{isLoadingAddresses ? "Finding addresses..." : lookupMessage || "Keep typing your postcode to load addresses."}</p>
          ) : null}
          <div className="minimal-select-wrap">
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
              aria-label="Service type"
              className={`minimal-select ${service ? "has-value" : ""}`}
            >
              <option value="" disabled>
                Select service
              </option>
              <option value="regular-home-cleaning">Regular Home Cleaning</option>
              <option value="deep-cleaning">Deep Cleaning</option>
              <option value="office-cleaning">Office Cleaning</option>
              <option value="airbnb-turnover-cleaning">Airbnb Turnover Cleaning</option>
            </select>
          </div>
          <a className="button button-primary" href={continueHref}>
            Continue
          </a>
        </form>
      </div>
    </main>
  );
}
