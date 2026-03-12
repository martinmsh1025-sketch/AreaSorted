"use client";

import { useState } from "react";

type AddressResult = {
  ID: string;
  Line: string;
};

type EntryMode = "lookup" | "manual";

async function readJsonSafely(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Address lookup is temporarily unavailable. Please try manual entry.");
  }
}

export default function HomePage() {
  const [service, setService] = useState("");
  const [postcode, setPostcode] = useState("");
  const [addressId, setAddressId] = useState("");
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>("lookup");
  const [manualAddress, setManualAddress] = useState("");

  const selectedAddress = addresses.find((item) => item.ID === addressId);
  const chosenAddress = entryMode === "manual" ? manualAddress.trim() : selectedAddress?.Line ?? "";
  const continueHref = `/instant-quote?${new URLSearchParams({
    postcode,
    service,
    address: chosenAddress,
  }).toString()}`;

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
      const data = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to find addresses for that postcode.");
      }

      setAddresses(data.results ?? []);
      setAddressId("");
      setLookupMessage(data.results?.length ? "Select your address." : "No address found. You can use the manual tab instead.");
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
          <div className="hero-minimal-tabs" role="tablist" aria-label="Address entry method">
            <button
              type="button"
              className={`hero-minimal-tab ${entryMode === "lookup" ? "hero-minimal-tab-active" : ""}`}
              onClick={() => setEntryMode("lookup")}
            >
              Find address
            </button>
            <button
              type="button"
              className={`hero-minimal-tab ${entryMode === "manual" ? "hero-minimal-tab-active" : ""}`}
              onClick={() => setEntryMode("manual")}
            >
              Manual address
            </button>
          </div>
          {entryMode === "lookup" ? (
            <div className="hero-minimal-search-row">
              <input
                placeholder="Postcode"
                aria-label="Postcode"
                value={postcode}
                onChange={(event) => {
                  setPostcode(event.target.value.toUpperCase());
                  setAddressId("");
                  setAddresses([]);
                  setLookupMessage("");
                }}
              />
              <button
                type="button"
                className="button button-secondary hero-minimal-find-button"
                onClick={() => void lookupAddresses(postcode)}
                disabled={isLoadingAddresses}
              >
                {isLoadingAddresses ? "Finding..." : "Find"}
              </button>
            </div>
          ) : (
            <input
              placeholder="Postcode"
              aria-label="Postcode"
              value={postcode}
              onChange={(event) => setPostcode(event.target.value.toUpperCase())}
            />
          )}
          {entryMode === "lookup" && addresses.length ? (
            <div className="minimal-select-wrap">
              <select
                value={addressId}
                onChange={(event) => {
                  setAddressId(event.target.value);
                }}
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
          {entryMode === "manual" ? (
            <>
              <input
                placeholder="Address line 1"
                aria-label="Manual address"
                value={manualAddress}
                onChange={(event) => setManualAddress(event.target.value)}
              />
              <p className="hero-minimal-note">Enter your address manually if you prefer not to search by postcode.</p>
            </>
          ) : null}
          {postcode && entryMode === "lookup" ? (
            <p className="hero-minimal-note">{isLoadingAddresses ? "Finding addresses..." : lookupMessage || "Enter your postcode and click Find."}</p>
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
