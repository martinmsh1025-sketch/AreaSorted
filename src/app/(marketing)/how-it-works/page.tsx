import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works - Booking Local Services in London",
  description:
    "See how AreaSorted works from postcode check to confirmed booking, temporary card hold, provider confirmation, and job-day support across London.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How AreaSorted Works | AreaSorted",
    description:
      "Understand the AreaSorted booking flow: check coverage, get a quote, continue securely, wait for confirmation, and manage your booking online.",
  },
};

const steps = [
  {
    number: "01",
    title: "Check your postcode",
    description:
      "Start with your London postcode so AreaSorted can check coverage before you spend time completing the full quote flow.",
  },
  {
    number: "02",
    title: "Choose the service and job details",
    description:
      "Select the right service, property type, job size, timing, and any add-ons. Your quote is built from the details you enter.",
  },
  {
    number: "03",
    title: "Review your quote",
    description:
      "You see the service price, booking fee, and any adjustments before deciding whether to continue to booking.",
  },
  {
    number: "04",
    title: "Continue securely",
    description:
      "When you continue booking, AreaSorted places a temporary card hold first. You are not charged at this stage.",
  },
  {
    number: "05",
    title: "Wait for booking confirmation",
    description:
      "A suitable local provider is matched based on coverage, service fit, and availability. Payment is only captured once the booking is confirmed.",
  },
  {
    number: "06",
    title: "Manage updates online",
    description:
      "You can review booking details, upcoming jobs, and support information through your AreaSorted account.",
  },
];

const faqs = [
  {
    question: "When am I charged?",
    answer:
      "AreaSorted places a temporary card hold when you continue booking. Payment is only captured once the booking is confirmed.",
  },
  {
    question: "Do I need an account to complete a booking?",
    answer:
      "You can explore coverage and pricing first, but you need an account to continue with booking, payment status, and future updates.",
  },
  {
    question: "How do I know if my area is covered?",
    answer:
      "Start with your postcode. AreaSorted checks London coverage first so you know whether services are available in your area.",
  },
  {
    question: "Who carries out the work?",
    answer:
      "Jobs are carried out by vetted independent professionals who have been approved to work through AreaSorted.",
  },
];

export default function HowItWorksPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How AreaSorted booking works",
    description: "Check postcode coverage, see a quote, continue securely, and wait for provider confirmation.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.description,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">How it works</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            A clearer booking flow for local services in London.
          </h1>
          <p className="lead">
            AreaSorted helps you check coverage, see a clear quote, continue securely, and wait for booking confirmation through one managed process.
          </p>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/pricing">See pricing</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">Step by step</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>From postcode check to confirmed booking</h2>
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

      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What you see</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Clear pricing before you continue</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Quotes are built from the service type, job size, postcode, timing, and any extras you choose. The booking fee is shown separately, so the total is clear before checkout.
            </p>
          </div>
          <div className="panel card">
            <div className="eyebrow">What happens next</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Confirmation comes before capture</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              AreaSorted uses a temporary card hold while a suitable provider is matched. Once the booking is confirmed, payment is captured and the booking details move forward.
            </p>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Common questions</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Booking flow FAQ</h2>
          </div>
          <div style={{ display: "grid", gap: "1rem" }}>
            {faqs.map((item) => (
              <div key={item.question} className="panel card">
                <strong style={{ display: "block", marginBottom: "0.45rem" }}>{item.question}</strong>
                <p style={{ color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: 700 }}>
          <h2 className="title">Ready to start?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
            Check coverage, review pricing, and move into booking when you are ready.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.4rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/services">Browse services</Link>
            <Link className="button button-secondary" href="/faq">Read FAQ</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
