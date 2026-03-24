import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog } from "@/lib/service-catalog";

const gardenJobs = jobTypeCatalog.filter((job) => job.service === "garden-maintenance");
const startingPrice = Math.min(...gardenJobs.map((job) => job.startingPrice));

export const metadata: Metadata = {
  title: "Garden Maintenance Services in London",
  description:
    "Book garden maintenance services in London through AreaSorted for tidy-ups, lawn care, hedge cutting, seasonal work, trimming, and outdoor finishing jobs.",
  alternates: {
    canonical: "/services/garden-maintenance",
  },
  openGraph: {
    title: "Garden Maintenance Services in London | AreaSorted",
    description:
      "Browse garden maintenance jobs in London, understand what affects pricing, and continue to booking with a clear quote and managed confirmation flow.",
  },
};

const popularJobs = gardenJobs.slice(0, 6);

const faqs = [
  {
    question: "What garden jobs can I book?",
    answer:
      "AreaSorted supports lawn care, hedge trimming, garden tidy-ups, seasonal clearance, cutting, pruning, and selected outdoor washing or finishing work depending on the job type.",
  },
  {
    question: "What affects garden maintenance pricing?",
    answer:
      "Garden quotes depend on garden size, growth level, waste volume, access, equipment needs, timing, postcode, and whether the booking is routine or seasonal.",
  },
  {
    question: "Can I book one-off garden tidy-ups?",
    answer:
      "Yes. Garden maintenance can be booked for one-off tidy-ups, seasonal resets, or more routine upkeep depending on the job you select.",
  },
  {
    question: "Does waste removal form part of the job?",
    answer:
      "That depends on the garden task and the quote. Some bookings may include or price for waste handling separately depending on the volume involved.",
  },
];

export default function GardenMaintenanceServicePage() {
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
          <div className="eyebrow">Garden maintenance services</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Garden maintenance services in London for tidy-ups, trimming, and seasonal outdoor work.
          </h1>
          <p className="lead">
            Book routine garden jobs, cutting and trimming work, seasonal clear-outs, and practical outdoor maintenance through one structured AreaSorted flow.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[`${gardenJobs.length} garden job types`, `From ${formatMoney(startingPrice)}`, "Coverage across London"].map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", minHeight: 38, padding: "0.55rem 0.85rem", borderRadius: 999, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", fontSize: "0.92rem", fontWeight: 600 }}>{item}</span>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/pricing">See garden pricing</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What this covers</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common garden jobs customers book</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Lawn mowing and routine garden upkeep</li>
              <li>Hedge trimming, pruning, and cutting back</li>
              <li>Seasonal tidy-ups and overgrowth control</li>
              <li>Leaf clearance and general outdoor resetting</li>
              <li>Selected washing and finishing tasks for outdoor areas</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Who it suits</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Homes, landlords, and seasonal maintenance needs</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Garden maintenance bookings are often used by households, landlords, and customers who want to restore outdoor spaces before viewings, warmer months, handovers, or routine upkeep.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Popular garden jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Frequently booked outdoor work</h2>
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
    </main>
  );
}
