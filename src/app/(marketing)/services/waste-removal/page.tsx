import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

const wasteRemovalJobs = jobTypeCatalog.filter((job) => job.service === "waste-removal");
const startingPrice = Math.min(...wasteRemovalJobs.map((job) => job.startingPrice));

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
  title: "Waste Removal Services in London",
  description:
    "Book waste removal services in London through AreaSorted for bulky items, household waste, property clearances, garden waste, and special disposal jobs.",
  alternates: {
    canonical: "/services/waste-removal",
  },
  openGraph: {
    title: "Waste Removal Services in London | AreaSorted",
    description:
      "Browse waste removal jobs in London, understand photo-led pricing, and continue to booking with a clear quote and managed confirmation flow.",
  },
};

const popularJobs = wasteRemovalJobs.slice(0, 6);

const faqs = [
  {
    question: "What waste removal jobs can I book?",
    answer:
      "AreaSorted supports household waste collection, bulky item removal, property clearances, garden waste jobs, and some special disposal requests depending on the item type.",
  },
  {
    question: "What affects waste removal pricing?",
    answer:
      "Quotes depend on volume, item type, access, stairs, loading time, urgency, postcode, and whether photos are needed to confirm the job size.",
  },
  {
    question: "Can I book bulky item removal?",
    answer:
      "Yes. Waste removal can include furniture, white goods, and other large items where the job type supports bulky collection and access is suitable.",
  },
  {
    question: "Do I need to provide photos?",
    answer:
      "For some waste jobs, photos help confirm the load size and access conditions so the quote and booking route are more accurate.",
  },
];

export default async function WasteRemovalServicePage() {
  const enabledServiceValues = await getEnabledServiceValues();
  if (!enabledServiceValues.includes("waste-removal")) notFound();
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
    name: "Waste removal services in London",
    description: "Book waste removal services in London through AreaSorted for bulky items, household waste, property clearances, garden waste, and special disposal jobs.",
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
      { "@type": "ListItem", position: 3, name: "Waste Removal", item: `${siteUrl}/services/waste-removal` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Waste removal services</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Waste removal services in London with clearer quotes and managed booking.
          </h1>
          <p className="lead">
            Book bulky waste collection, household clearances, garden waste removal, and property tidy-up jobs through one structured AreaSorted flow.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[`${wasteRemovalJobs.length} waste removal job types`, `From ${formatMoney(startingPrice)}`, "Coverage across London"].map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", minHeight: 38, padding: "0.55rem 0.85rem", borderRadius: 999, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", fontSize: "0.92rem", fontWeight: 600 }}>{item}</span>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/pricing">See waste removal pricing</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What this covers</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common removal jobs customers book</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Bulky household item removal and single-item collections</li>
              <li>Rubbish clearance after moves, tidy-ups, or maintenance work</li>
              <li>Garden waste and outdoor clearance tasks</li>
              <li>Property-level clearances for homes and rental turnarounds</li>
              <li>Item-specific disposal routes where supported by the job type</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Who it suits</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Homes, landlords, move-outs, and practical clear-out needs</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Waste removal bookings are often used for end-of-tenancy clear-outs, furniture removal, renovation waste, seasonal garden tidy-ups, and same-week practical disposal needs.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Popular waste removal jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Frequently booked removal tasks</h2>
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
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What affects your waste removal quote</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Load size, item count, and collection type</li>
              <li>Access, stairs, parking, and loading time</li>
              <li>Whether photos are needed to confirm the scope</li>
              <li>Urgency, timing, and postcode</li>
              <li>Special disposal requirements for certain items</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">How booking works</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Scope first, confirmation after review</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Start with your postcode, describe the waste job clearly, and continue with a temporary card hold where applicable. Once the booking is confirmed, payment is captured and the collection moves forward.
            </p>
            <div className="button-row" style={{ marginTop: "1rem" }}>
              <Link className="button button-secondary" href="/how-it-works">How booking works</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
