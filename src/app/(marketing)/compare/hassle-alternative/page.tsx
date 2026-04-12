import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hassle.com Alternative — AreaSorted | London Home Services",
  description:
    "Hassle.com (Helpling UK) has shut down. AreaSorted is a London-based alternative offering cleaning, handyman, pest control, waste removal, garden maintenance, and furniture assembly with transparent pricing.",
  alternates: {
    canonical: "/compare/hassle-alternative",
  },
  openGraph: {
    title: "Hassle.com Alternative — AreaSorted",
    description:
      "Looking for a Hassle.com replacement? AreaSorted covers 6 home service categories across all 32 London boroughs with clear pricing and vetted providers.",
  },
};

const reasons = [
  {
    title: "More than just cleaning",
    description:
      "Hassle.com focused mainly on cleaning. AreaSorted covers cleaning, handyman, pest control, waste removal, garden maintenance, and furniture assembly — all through one platform.",
  },
  {
    title: "Transparent pricing engine",
    description:
      "Every quote is built from the service type, property details, add-ons, and postcode. You see the full breakdown before you pay — no hidden fees or surprise charges.",
  },
  {
    title: "London-focused coverage",
    description:
      "AreaSorted is built specifically for London. We cover all 32 boroughs with postcode-first matching so you know your area is served before you spend time on the booking flow.",
  },
  {
    title: "Vetted local providers",
    description:
      "Every professional goes through structured onboarding including identity checks, document verification, and admin approval before they can accept jobs.",
  },
  {
    title: "Secure payment flow",
    description:
      "A temporary card hold is placed at booking. Payment is only captured once the provider confirms the job. If the booking cannot be confirmed, the hold is released.",
  },
  {
    title: "One managed booking flow",
    description:
      "From postcode check to quote to booking confirmation, everything is handled through one structured process. No chasing providers, no unclear pricing, no fragmented communication.",
  },
];

const services = [
  { name: "Cleaning", href: "/services/cleaning", description: "Regular, deep, end of tenancy, and one-off cleaning" },
  { name: "Handyman", href: "/services/handyman", description: "Mounting, assembly, repairs, and small installations" },
  { name: "Pest Control", href: "/services/pest-control", description: "Mice, rats, bed bugs, insects, and proofing" },
  { name: "Waste Removal", href: "/services/waste-removal", description: "Bulky items, house clearance, and garden waste" },
  { name: "Garden Maintenance", href: "/services/garden-maintenance", description: "Mowing, weeding, hedge trimming, and seasonal care" },
  { name: "Furniture Assembly", href: "/services/furniture-assembly", description: "IKEA, flat-pack, and office furniture assembly" },
];

const faqs = [
  {
    question: "What happened to Hassle.com?",
    answer:
      "Hassle.com was acquired by Helpling in 2015 and operated as Helpling UK. The UK operation was shut down in early 2025 as part of a strategic withdrawal from unprofitable markets. The Hassle.com domain and service are no longer active.",
  },
  {
    question: "Can I book the same services I used on Hassle.com?",
    answer:
      "If you used Hassle.com primarily for cleaning, AreaSorted covers all the same cleaning types including regular cleaning, deep cleaning, and end of tenancy cleaning. We also offer five additional service categories that Hassle.com did not cover.",
  },
  {
    question: "How is AreaSorted different from Hassle.com?",
    answer:
      "AreaSorted covers six service categories instead of just cleaning, uses a structured pricing engine rather than hourly rates, and focuses exclusively on London with postcode-first coverage checks. All providers go through a structured vetting process before they can accept jobs.",
  },
  {
    question: "Is AreaSorted available in my area?",
    answer:
      "AreaSorted covers all 32 London boroughs. Enter your postcode on the quote page to check coverage for your specific area and see available services.",
  },
  {
    question: "How do I get started?",
    answer:
      "Enter your postcode, choose the service you need, and see a clear quote before deciding whether to continue. No account is needed to check prices.",
  },
];

export default function HassleAlternativePage() {
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://areasorted.com" },
      { "@type": "ListItem", position: 2, name: "Compare", item: "https://areasorted.com/compare" },
      { "@type": "ListItem", position: 3, name: "Hassle.com Alternative" },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Hassle.com Alternative</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Hassle.com has shut down. AreaSorted is here.
          </h1>
          <p className="lead">
            Hassle.com (Helpling UK) closed its UK operations in 2025. If you are looking for a reliable replacement
            for booking cleaning and other home services in London, AreaSorted covers six service categories across
            all 32 boroughs with transparent pricing and vetted providers.
          </p>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/services">Browse services</Link>
          </div>
        </div>
      </section>

      {/* What happened */}
      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Background</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What happened to Hassle.com?</h2>
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>
              Hassle.com launched in 2013 as a London cleaning marketplace. In 2015, it was acquired by Helpling, a
              Berlin-based home services platform. Helpling continued operating the UK business under the Hassle.com
              brand for several years, but the UK market proved unprofitable.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: "1rem" }}>
              In early 2025, Helpling withdrew from the UK entirely. The Hassle.com website is no longer active, and
              existing customers and cleaners were left to find alternative platforms. The closure followed a broader
              pattern of international home services startups struggling with unit economics in London.
            </p>
          </div>
        </div>
      </section>

      {/* Why switch to AreaSorted */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">Why switch</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              What AreaSorted offers instead
            </h2>
          </div>
          <div className="grid-2" style={{ gap: "1.5rem" }}>
            {reasons.map((item) => (
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

      {/* Services grid */}
      <section className="section muted-block">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">Services</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Six service categories — not just cleaning
            </h2>
            <p className="lead" style={{ marginTop: "0.8rem" }}>
              Hassle.com was cleaning-only. AreaSorted covers the full range of home services Londoners actually need.
            </p>
          </div>
          <div className="grid-3" style={{ gap: "1.25rem" }}>
            {services.map((service) => (
              <Link key={service.name} href={service.href} className="panel card" style={{ textDecoration: "none", color: "inherit" }}>
                <strong style={{ display: "block", marginBottom: "0.4rem" }}>{service.name}</strong>
                <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">FAQ</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common questions</h2>
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

      {/* CTA */}
      <section className="section muted-block">
        <div className="container" style={{ textAlign: "center", maxWidth: 660 }}>
          <h2 className="title">Ready to switch?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.6 }}>
            Enter your postcode to check coverage and get an instant quote. All services are carried out by
            vetted local professionals through AreaSorted.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/how-it-works">How it works</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
