import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

const handymanJobs = jobTypeCatalog.filter((job) => job.service === "handyman");
const startingPrice = Math.min(...handymanJobs.map((job) => job.startingPrice));

function getSafeSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://areasorted.com";
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://areasorted.com";
  }
}

export const metadata: Metadata = {
  title: "Handyman Services in London",
  description:
    "Book handyman services in London through AreaSorted for mounting, hanging, repairs, fixtures, fittings, adjustments, and light installation work.",
  alternates: {
    canonical: "/services/handyman",
  },
  openGraph: {
    title: "Handyman Services in London | AreaSorted",
    description:
      "Browse handyman jobs in London, understand what affects pricing, and continue to booking with a clear quote and managed confirmation flow.",
  },
};

const popularJobs = handymanJobs.slice(0, 6);

const faqs = [
  {
    question: "What handyman jobs can I book?",
    answer:
      "AreaSorted supports mounting, hanging, minor repairs, fixtures and fittings, flat adjustments, furniture-related tasks, and light installation work depending on the job type.",
  },
  {
    question: "What affects handyman prices?",
    answer:
      "Handyman quotes depend on the task type, job size, access, urgency, timing, postcode, and whether additional materials or extra tasks are involved.",
  },
  {
    question: "Do providers bring tools?",
    answer:
      "For handyman jobs, providers typically bring their own core tools. Some tasks may still require customer-supplied fittings or materials depending on the job.",
  },
  {
    question: "Can I book multiple small tasks together?",
    answer:
      "That depends on the scope and time required. AreaSorted uses job size and task details to build the quote, so bundled requests should be described clearly during booking.",
  },
];

export default async function HandymanServicePage() {
  const enabledServiceValues = await getEnabledServiceValues();
  if (!enabledServiceValues.includes("handyman")) notFound();
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
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Handyman services in London",
    areaServed: "London",
    provider: {
      "@type": "Organization",
      name: "AreaSorted",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: startingPrice,
        priceCurrency: "GBP",
      },
    },
  };
  const siteUrl = getSafeSiteUrl();
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services` },
      { "@type": "ListItem", position: 3, name: "Handyman", item: `${siteUrl}/services/handyman` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Handyman services</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Handyman services in London for repairs, fittings, and practical home jobs.
          </h1>
          <p className="lead">
            Use AreaSorted to book task-based handyman work across London, from mounting and hanging to fittings, adjustments, and small repair visits.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[`${handymanJobs.length} handyman job types`, `From ${formatMoney(startingPrice)}`, "Coverage across London"].map((item) => (
              <span
                key={item}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 38,
                  padding: "0.55rem 0.85rem",
                  borderRadius: 999,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-muted)",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                }}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/pricing">See handyman pricing</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What this covers</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common handyman work booked through AreaSorted</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>TV mounting, mirror hanging, shelves, rails, and wall fixtures</li>
              <li>Minor repairs and practical adjustments around the home</li>
              <li>Fixtures, fittings, and replacement tasks</li>
              <li>Small moving, alignment, and repositioning jobs</li>
              <li>Light electrical-style fitting tasks where appropriate to the job type</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Who it suits</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Flats, family homes, rentals, and practical maintenance needs</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Handyman bookings are often used for snagging lists, move-in setup, home improvements, maintenance catch-up, and smaller repair jobs that do not justify a larger contractor visit.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Popular handyman jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Frequently booked task types</h2>
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
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What affects your handyman quote</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Task complexity and expected time on site</li>
              <li>Single-job versus multi-task requests</li>
              <li>Access, wall type, fittings, and job-specific constraints</li>
              <li>Urgency, timing, and postcode</li>
              <li>Any materials or extra items involved in the visit</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">How booking works</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Structured quote first, confirmation after</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Describe the task clearly, review the quote, and continue with a temporary card hold. Once a suitable local provider confirms availability, payment is captured and the booking progresses.
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
            <div className="eyebrow">Handyman FAQ</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common questions about handyman bookings</h2>
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

      <section className="section muted-block">
        <div className="container" style={{ textAlign: "center", maxWidth: 700 }}>
          <h2 className="title">Ready to book handyman work in London?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
            Check your area, review the task pricing, and continue to booking when the quote works for you.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.4rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/london">Browse areas</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
