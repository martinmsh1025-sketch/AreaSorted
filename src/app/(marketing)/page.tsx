"use client";

import { useState } from "react";

export default function HomePage() {
  const [service, setService] = useState("");

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
        <form className="panel mini-form hero-minimal-form">
          <input placeholder="Postcode" aria-label="Postcode" />
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
          <a className="button button-primary" href="/instant-quote">
            Continue
          </a>
        </form>
      </div>
    </main>
  );
}
