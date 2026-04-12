import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

const furnitureAssemblyJobs = jobTypeCatalog.filter((job) => job.service === "furniture-assembly");
const startingPrice = Math.min(...furnitureAssemblyJobs.map((job) => job.startingPrice));

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
  title: "Furniture Assembly Services in London",
  description:
    "Book furniture assembly services in London through AreaSorted for flat-pack builds, bedroom furniture, office furniture, dining setups, disassembly, and anchoring work.",
  alternates: {
    canonical: "/services/furniture-assembly",
  },
  openGraph: {
    title: "Furniture Assembly Services in London | AreaSorted",
    description:
      "Browse furniture assembly jobs in London, understand what affects pricing, and continue to booking with a clear quote and managed confirmation flow.",
  },
};

const popularJobs = furnitureAssemblyJobs.slice(0, 6);

const faqs = [
  {
    question: "What furniture assembly jobs can I book?",
    answer:
      "AreaSorted supports flat-pack assembly, bedroom furniture, wardrobes, desks, shelving, dining furniture, disassembly, and anchoring tasks depending on the item type.",
  },
  {
    question: "What affects furniture assembly pricing?",
    answer:
      "Quotes depend on the item type, assembly complexity, number of pieces, anchoring needs, access, urgency, postcode, and whether disassembly or repositioning is also needed.",
  },
  {
    question: "Can I book multiple pieces of furniture together?",
    answer:
      "Yes, where the quote matches the time and scope involved. You should describe the number and type of items clearly during booking.",
  },
  {
    question: "Can assembly include wall anchoring?",
    answer:
      "Some furniture assembly jobs support anchoring as part of the task or as an add-on, depending on the item and wall conditions.",
  },
];

export default async function FurnitureAssemblyServicePage() {
  const enabledServiceValues = await getEnabledServiceValues();
  if (!enabledServiceValues.includes("furniture-assembly")) notFound();
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
    name: "Furniture assembly services in London",
    description: "Book furniture assembly services in London through AreaSorted for flat-pack builds, bedroom furniture, office furniture, dining setups, disassembly, and anchoring work.",
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
      { "@type": "ListItem", position: 3, name: "Furniture Assembly", item: `${siteUrl}/services/furniture-assembly` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Furniture assembly services</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Furniture assembly services in London for flat-pack builds, setup, and anchoring.
          </h1>
          <p className="lead">
            Book bedroom, living room, office, and dining furniture assembly through one structured AreaSorted flow, including selected disassembly and anchoring work.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[`${furnitureAssemblyJobs.length} furniture assembly job types`, `From ${formatMoney(startingPrice)}`, "Coverage across London"].map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", minHeight: 38, padding: "0.55rem 0.85rem", borderRadius: 999, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", fontSize: "0.92rem", fontWeight: 600 }}>{item}</span>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/pricing">See assembly pricing</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What this covers</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common assembly jobs customers book</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Wardrobes, beds, bedside furniture, and bedroom storage</li>
              <li>Desks, office units, and work-from-home furniture</li>
              <li>Dining tables, chairs, shelving, and living room items</li>
              <li>Disassembly and reassembly during moves or room changes</li>
              <li>Selected wall anchoring or safety fixing tasks</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Who it suits</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>New furniture deliveries, move-ins, and room setup jobs</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Furniture assembly bookings are often used after deliveries, house moves, office setup changes, and home improvements where customers want a smoother, quicker build process.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Popular assembly jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Frequently booked furniture builds</h2>
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
