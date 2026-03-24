import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog } from "@/lib/service-catalog";

const pestControlJobs = jobTypeCatalog.filter((job) => job.service === "pest-control");
const startingPrice = Math.min(...pestControlJobs.map((job) => job.startingPrice));

export const metadata: Metadata = {
  title: "Pest Control Services in London",
  description:
    "Book pest control services in London through AreaSorted for rodents, insects, inspections, reports, proofing, and follow-up visits.",
  alternates: {
    canonical: "/services/pest-control",
  },
  openGraph: {
    title: "Pest Control Services in London | AreaSorted",
    description:
      "Browse pest control jobs in London, understand inspection-led pricing, and continue to booking with a clear quote and managed confirmation flow.",
  },
};

const popularJobs = pestControlJobs.slice(0, 6);

const faqs = [
  {
    question: "What pest control jobs can I book?",
    answer:
      "AreaSorted supports rodent control, insect treatments, inspections, written reports, proofing work, and follow-up pest visits depending on the issue and property type.",
  },
  {
    question: "Why are some pest jobs inspection-first?",
    answer:
      "Some pest issues need an inspection before a final treatment plan is confirmed. That helps make sure the booking matches the property, severity, and treatment required.",
  },
  {
    question: "What affects pest control prices?",
    answer:
      "Pest control quotes depend on the type of pest, property size, urgency, access, complexity, report requirements, follow-up needs, and postcode.",
  },
  {
    question: "Can I book urgent pest control?",
    answer:
      "Priority and short-notice availability may be available depending on the issue, your postcode, and provider confirmation.",
  },
];

export default function PestControlServicePage() {
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

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Pest control services</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Pest control services in London with inspection-led booking and clearer pricing.
          </h1>
          <p className="lead">
            Book pest inspections, rodent treatments, insect control, proofing work, and follow-up visits through one structured AreaSorted flow.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[`${pestControlJobs.length} pest control job types`, `From ${formatMoney(startingPrice)}`, "Coverage across London"].map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", minHeight: 38, padding: "0.55rem 0.85rem", borderRadius: 999, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", fontSize: "0.92rem", fontWeight: 600 }}>
                {item}
              </span>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/pricing">See pest control pricing</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What this covers</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common pest issues customers book for</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Rat and mouse treatments for homes and small commercial spaces</li>
              <li>Cockroach, bed bug, flea, ant, and wasp-related jobs</li>
              <li>Inspections, written reports, and property assessment visits</li>
              <li>Proofing and follow-up work after treatment</li>
              <li>Urgent or priority pest response where available</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Who it suits</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Households, landlords, rentals, and time-sensitive issues</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Pest control bookings are often used when customers need a fast response, documented inspection, or a clearer view of what treatment is appropriate before more work is arranged.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Popular pest control jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Frequently searched pest services</h2>
          </div>
          <div className="grid-2" style={{ gap: "1rem" }}>
            {popularJobs.map((job) => (
              <div key={job.value} className="panel card">
                <strong style={{ display: "block", marginBottom: "0.4rem" }}>{job.label}</strong>
                <p style={{ color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>{job.strapline}</p>
                <div style={{ marginTop: "0.9rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  Starting from <strong style={{ color: "var(--color-text)" }}>{formatMoney(job.startingPrice)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">Pricing factors</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What affects your pest control quote</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Pest type and treatment complexity</li>
              <li>Whether the visit is inspection-led or treatment-led</li>
              <li>Property size, access, and repeat infestation level</li>
              <li>Urgency, timing, and postcode</li>
              <li>Need for reports, proofing, or follow-up work</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">How booking works</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Quote first, confirmation after review</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Describe the issue, review the quote or inspection route, and continue with a temporary card hold. Once the booking is confirmed, payment is captured and the job moves forward.
            </p>
            <div className="button-row" style={{ marginTop: "1rem" }}>
              <Link className="button button-secondary" href="/how-it-works">How booking works</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Pest control FAQ</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common questions about pest bookings</h2>
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
    </main>
  );
}
