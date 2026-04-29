import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "AreaSorted was founded by Martin Ma to make home services easier to trust, with stronger provider standards, clearer information, and better protection for both customers and providers.",
  openGraph: {
    title: "About AreaSorted — Trusted Local Services in London",
    description:
      "Learn why Martin Ma founded AreaSorted to build a higher-trust marketplace for home services in London.",
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
      "Every provider on the platform goes through structured onboarding, profile review, and document checks before they can accept jobs.",
  },
  {
    title: "Real provider context",
    description:
      "Customers should understand who they are booking - not just see a name and a rating. We want clearer provider backgrounds, communication details, insurance, DBS status where relevant, and experience signals.",
  },
  {
    title: "Protection on both sides",
    description:
      "Customers deserve a safer booking experience, and providers deserve a fair dispute process and a better chance of getting paid properly for completed work.",
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
  { value: "Higher-bar", label: "Provider entry standard" },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">About AreaSorted</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            A higher-trust marketplace for home services in London.
          </h1>
          <p className="lead">
            AreaSorted was founded by Martin Ma to make home services feel less uncertain, less opaque, and less dependent on guesswork. We want customers to understand who they are booking - and good providers to work in a platform that values trust, standards, and fairness.
          </p>
        </div>
      </section>

      {/* Founder story */}
      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Founder story</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Why Martin Ma started AreaSorted.
            </h2>
          </div>
          <div className="marketing-story-stack">
            <div className="marketing-crop-frame marketing-crop-frame-about-hero">
              <Image
                src="/images/derived-board-tight/about-house-clean.png"
                alt="AreaSorted home services illustration"
                fill
                className="marketing-crop-image"
                sizes="(max-width: 720px) 100vw, 50vw"
              />
            </div>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>
              I started AreaSorted after seeing the same problem again and again across the UK home services market: customers often have to rely on word of mouth or online reviews to judge whether a provider is right for them. In many cases, that is still not enough to make a confident decision.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: "1rem" }}>
              My view was simple - booking a cleaner, handyman, pest controller, or any other home service professional should not feel like guesswork. Customers should be able to understand a provider's background, experience, communication style, insurance position, and DBS status where relevant before they book.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: "1rem" }}>
              That is why AreaSorted is being built with a higher bar for provider entry. We want stronger vetting, better provider introductions, and more meaningful information than a review score alone can provide.
            </p>
          </div>
        </div>
      </section>

      {/* Founder note */}
      <section className="section muted-block">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="panel card" style={{ padding: "2rem", borderRadius: "1.5rem" }}>
            <div className="eyebrow">Founder note</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              “Trust should not start and end with a review score.”
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.8, margin: 0 }}>
              When people book someone to come into their home, they are making a trust decision, not just a price decision. I believe customers deserve more context before they book, and providers deserve a fairer system after the job is done. AreaSorted is my attempt to build that middle layer of trust properly.
            </p>
            <p style={{ marginTop: "1rem", fontWeight: 700 }}>Martin Ma, Founder</p>
          </div>
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
              We focus on stronger provider standards, better profile transparency, postcode-first coverage, and clearer quote building so customers can move from research to booking with more confidence - while providers can work in a more structured, respected, and fair environment.
            </p>
          </div>
        </div>
      </section>

      {/* Customer + provider promise */}
      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">For customers</div>
            <h2 className="title" style={{ marginTop: "0.6rem", fontSize: "1.5rem" }}>
              More confidence before you book.
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>
              We want customers to make better-informed decisions, not just rely on ratings. That means clearer provider backgrounds, structured pricing, stronger entry standards, and platform support when something goes wrong.
            </p>
          </div>
          <div className="panel card">
            <div className="eyebrow">For providers</div>
            <h2 className="title" style={{ marginTop: "0.6rem", fontSize: "1.5rem" }}>
              More protection after the job is done.
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>
              Good providers should not be left dealing with unclear expectations, payment anxiety, or one-sided complaints on their own. AreaSorted is designed to support fairer dispute handling, clearer job expectations, and a more reliable route to paid work.
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
              We want a higher barrier to entry than a typical listing site.
            </h2>
            <p className="lead" style={{ fontSize: "1rem" }}>
              Reviews alone do not tell the full story. Our aim is to introduce providers properly, verify key information, and create a stronger baseline of trust before they can accept work through AreaSorted.
            </p>
          </div>
          <div className="panel card">
              <strong style={{ display: "block", marginBottom: "1rem" }}>Checks and standards can include</strong>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>Identity and account verification</li>
              <li>Insurance and document checks</li>
              <li>DBS status where relevant to the service</li>
              <li>Service capability and experience review</li>
              <li>Communication and professionalism standards</li>
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
