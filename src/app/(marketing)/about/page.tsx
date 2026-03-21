import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "AreaSorted connects London customers with vetted, independent service providers for cleaning, pest control, handyman work, furniture assembly, waste removal, and garden maintenance.",
  openGraph: {
    title: "About AreaSorted — Trusted Local Services in London",
    description:
      "Learn about AreaSorted's mission, provider verification process, and how we connect London customers with vetted local service providers.",
  },
};

const values = [
  {
    title: "Transparent pricing",
    description:
      "Every quote is generated from a structured pricing engine. You see the full breakdown — base price, add-ons, booking fee — before you pay.",
  },
  {
    title: "Vetted providers",
    description:
      "Every provider on the platform goes through identity checks, document verification, and a structured onboarding process before they can accept jobs.",
  },
  {
    title: "One managed flow",
    description:
      "From quote to completion, everything is handled through one booking system. No chasing, no separate invoices, no guesswork.",
  },
  {
    title: "Local knowledge",
    description:
      "Providers are matched by postcode coverage, availability, and capability — so you get someone who actually works in your area.",
  },
];

const steps = [
  {
    number: "01",
    title: "Enter your postcode",
    description:
      "Check coverage for your area. We serve all 32 London boroughs and match you with a provider who covers your postcode.",
  },
  {
    number: "02",
    title: "Get an instant quote",
    description:
      "Choose your service, property type, and any add-ons. The pricing engine calculates a transparent quote with no hidden fees.",
  },
  {
    number: "03",
    title: "Book and pay securely",
    description:
      "Confirm your booking and pay online. Your payment is processed securely and the provider is assigned automatically.",
  },
  {
    number: "04",
    title: "Service is carried out",
    description:
      "An independent, vetted provider carries out the work at the scheduled time. Everything is tracked through the platform.",
  },
];

const stats = [
  { value: "6", label: "Service categories" },
  { value: "57", label: "Job types available" },
  { value: "32", label: "London boroughs covered" },
  { value: "12-step", label: "Provider onboarding" },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">About AreaSorted</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            A London services platform built around trust, structure, and verified onboarding.
          </h1>
          <p className="lead">
            AreaSorted connects customers with independent, vetted service providers across London. 
            We handle the booking, payment, and provider matching — so both sides get a clear, 
            structured experience from start to finish.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="section muted-block">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "2rem",
              textAlign: "center",
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 800,
                    color: "var(--color-brand)",
                    fontFamily: "var(--font-display)",
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ marginTop: "0.4rem", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Our mission</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Give customers a clearer way to book — and give providers a better way to work.
            </h2>
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>
              Most local service marketplaces are either opaque on pricing, unreliable on quality, or both. 
              AreaSorted was built to solve this by putting structure at the centre: a shared pricing engine, 
              proper provider onboarding, and a single managed booking flow that keeps everything in one place.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: "1rem" }}>
              Providers are self-employed professionals who set their own availability and coverage areas. 
              AreaSorted handles the customer-facing booking, payment processing, and job assignment — so 
              providers can focus on the work itself.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section muted-block">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">How it works</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              From postcode to completed job — in four steps.
            </h2>
          </div>
          <div className="grid-2" style={{ gap: "1.5rem" }}>
            {steps.map((step) => (
              <div key={step.number} className="panel card" style={{ display: "flex", gap: "1.2rem", alignItems: "start" }}>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: "var(--color-brand)",
                    fontFamily: "var(--font-display)",
                    lineHeight: 1,
                    flexShrink: 0,
                    minWidth: "2.4rem",
                  }}
                >
                  {step.number}
                </div>
                <div>
                  <strong style={{ display: "block", marginBottom: "0.4rem" }}>{step.title}</strong>
                  <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">What we stand for</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Built differently from the start.
            </h2>
          </div>
          <div className="grid-2" style={{ gap: "1.5rem" }}>
            {values.map((item) => (
              <div key={item.title} className="panel card">
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>{item.title}</strong>
                <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider onboarding */}
      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Provider verification</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Every provider goes through a 12-step onboarding process.
            </h2>
            <p className="lead" style={{ fontSize: "1rem" }}>
              This is not a simple sign-up. Providers submit documentation, complete identity verification, 
              and go through admin review before they can accept any jobs on the platform.
            </p>
          </div>
          <div className="panel card">
            <strong style={{ display: "block", marginBottom: "1rem" }}>Onboarding includes</strong>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>Email verification and account setup</li>
              <li>Business details and trading name</li>
              <li>Identity document upload</li>
              <li>Right-to-work verification</li>
              <li>Service capability selection</li>
              <li>Coverage area and postcode mapping</li>
              <li>Availability schedule configuration</li>
              <li>Admin review and approval</li>
              <li>Stripe Connect payment onboarding</li>
              <li>Pricing confirmation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: 660 }}>
          <h2 className="title">Ready to book a service?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.6 }}>
            Enter your postcode to check coverage and get an instant quote. All services are arranged 
            through AreaSorted and carried out by independent, vetted providers.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/contact">Contact us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
