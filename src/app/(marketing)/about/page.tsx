import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "AreaSorted helps London customers book trusted local services with clearer pricing, structured booking, and vetted professionals across multiple service categories.",
  openGraph: {
    title: "About AreaSorted — Trusted Local Services in London",
    description:
      "Learn how AreaSorted helps London customers book trusted local services with clearer pricing, postcode-first coverage checks, and vetted professionals.",
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
      "From quote to booking confirmation, everything is handled through one structured flow. No chasing around for prices, availability, or next steps.",
  },
  {
    title: "Local knowledge",
    description:
      "We focus on London coverage, postcode fit, and practical service matching so customers can book with more confidence.",
  },
];

const steps = [
  {
    number: "01",
    title: "Enter your postcode",
    description:
      "Check coverage for your area first. We focus on London and use postcode-led matching to keep the process practical and local.",
  },
  {
    number: "02",
    title: "Get an instant quote",
    description:
      "Choose your service, property type, and any add-ons. You see a clear quote before deciding whether to continue.",
  },
  {
    number: "03",
    title: "Continue booking securely",
    description:
      "Continue securely online. We place a temporary card hold first and only capture payment once the booking is confirmed.",
  },
  {
    number: "04",
    title: "Service is carried out",
    description:
      "A vetted local professional carries out the work at the scheduled time, with support available if booking details need to change.",
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
            A clearer way to book trusted local services in London.
          </h1>
          <p className="lead">
            AreaSorted is built for customers who want transparent pricing, vetted professionals, and a smoother booking experience across London. We bring pricing, coverage checks, and booking support into one place.
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
              Booking local services is often frustrating: unclear prices, patchy communication, and too much uncertainty before the job is even confirmed. AreaSorted is designed to make that experience simpler, clearer, and easier to trust.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: "1rem" }}>
              We focus on postcode-first coverage, transparent quote building, and vetted professionals across key home service categories so customers can move from research to booking with less friction.
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
            <div className="eyebrow">Trust and standards</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Every professional on the platform goes through structured onboarding.
            </h2>
            <p className="lead" style={{ fontSize: "1rem" }}>
              We do proper checks before a professional can accept work through AreaSorted. That helps create a more reliable experience for customers from the start.
            </p>
          </div>
          <div className="panel card">
              <strong style={{ display: "block", marginBottom: "1rem" }}>Checks can include</strong>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>Identity and account verification</li>
              <li>Eligibility and document checks</li>
              <li>Service capability review</li>
              <li>Coverage area setup</li>
              <li>Availability and operational setup</li>
              <li>Admin approval before activation</li>
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
            <Link className="button button-primary" href="/quote">Continue booking</Link>
            <Link className="button button-secondary" href="/contact">Contact us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
