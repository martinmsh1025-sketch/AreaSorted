import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Handy.com Alternative — AreaSorted | London Home Services",
  description:
    "Handy.com is no longer available in the UK. AreaSorted is a London-based alternative for cleaning, handyman, pest control, waste removal, garden maintenance, and furniture assembly with vetted providers and transparent pricing.",
  alternates: {
    canonical: "/compare/handy-alternative",
  },
  openGraph: {
    title: "Handy.com Alternative — AreaSorted",
    description:
      "Looking for a Handy.com replacement in London? AreaSorted offers 6 home service categories with clear pricing, postcode-first booking, and vetted local professionals.",
  },
};

const reasons = [
  {
    title: "Properly structured provider relationships",
    description:
      "Handy.com faced legal action over worker misclassification. AreaSorted works with properly registered independent providers through a transparent business model. Providers set their own prices and operate as independent businesses.",
  },
  {
    title: "Broader service coverage",
    description:
      "Handy.com covered cleaning and handyman. AreaSorted adds pest control, waste removal, garden maintenance, and furniture assembly — six categories through one platform.",
  },
  {
    title: "London-first approach",
    description:
      "Instead of spreading thin across multiple countries, AreaSorted focuses entirely on London. Every postcode, provider, and pricing adjustment is calibrated for the London market.",
  },
  {
    title: "Transparent quote-based pricing",
    description:
      "Quotes are built from the service type, property details, timing, and add-ons. You see the full breakdown before you pay — no hourly guesswork or unclear final totals.",
  },
  {
    title: "Secure hold-then-capture payments",
    description:
      "A temporary card hold is placed at booking. Payment is only captured once the provider confirms. If the booking cannot be confirmed, the hold is released — not charged.",
  },
  {
    title: "Vetted and approved providers",
    description:
      "Every professional goes through identity checks, document verification, and structured onboarding before they can accept jobs through the platform.",
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
    question: "What happened to Handy.com?",
    answer:
      "Handy.com raised over $110 million and was acquired by ANGI Homeservices in 2018. The UK service was discontinued and the Handy.com website now returns a 404 error. The company faced significant legal challenges including worker misclassification lawsuits and FTC action in January 2025.",
  },
  {
    question: "Can I book the same services I used on Handy.com?",
    answer:
      "If you used Handy.com for cleaning or handyman services, AreaSorted covers both plus four additional categories. Our handyman services include mounting, assembly, repairs, and small installations — similar to what Handy.com offered.",
  },
  {
    question: "How is AreaSorted different from Handy.com?",
    answer:
      "AreaSorted focuses on London only, uses quote-based pricing instead of hourly rates, covers six service categories, and works with properly registered independent providers. Our payment flow uses temporary holds with capture only on provider confirmation.",
  },
  {
    question: "Are AreaSorted providers employees or independent contractors?",
    answer:
      "Providers on AreaSorted are independent registered businesses. They set their own pricing, manage their own availability, and operate through their own business entities. This is fundamentally different from the gig-economy model that caused legal problems for Handy.com.",
  },
  {
    question: "Is AreaSorted available in my area?",
    answer:
      "AreaSorted covers all 32 London boroughs. Enter your postcode on the quote page to check coverage for your specific location and see available services.",
  },
];

const timeline = [
  { year: "2012", event: "Handy.com launched in the US as Handybook" },
  { year: "2014", event: "Expanded to London and other UK cities" },
  { year: "2015", event: "Faced multiple worker misclassification lawsuits" },
  { year: "2018", event: "Acquired by ANGI Homeservices (IAC)" },
  { year: "2023", event: "UK operations wound down" },
  { year: "2025", event: "FTC action filed; Handy.com returns 404" },
];

export default function HandyAlternativePage() {
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
      { "@type": "ListItem", position: 3, name: "Handy.com Alternative" },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Handy.com Alternative</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Handy.com is gone. AreaSorted is the London alternative.
          </h1>
          <p className="lead">
            Handy.com shut down its UK service after years of legal challenges and operational difficulties.
            AreaSorted is a London-focused home services platform covering cleaning, handyman, pest control,
            waste removal, garden maintenance, and furniture assembly — built on a sustainable provider model
            from day one.
          </p>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/services">Browse services</Link>
          </div>
        </div>
      </section>

      {/* What happened to Handy */}
      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Background</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What happened to Handy.com?</h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: "0.8rem" }}>
              Handy.com was a US-founded home services marketplace that expanded to London in 2014. Despite raising
              over $110 million in venture funding, the company faced persistent legal challenges over how it classified
              its workers.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: "1rem" }}>
              Multiple lawsuits alleged that Handy treated workers as independent contractors while controlling their
              schedules, pricing, and customer interactions like employees. In January 2025, the FTC filed action against
              the company. The UK service was discontinued, and Handy.com now returns a 404 error.
            </p>
          </div>
          <div className="panel card">
            <strong style={{ display: "block", marginBottom: "1rem" }}>Timeline</strong>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {timeline.map((item) => (
                <div key={item.year} style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
                  <span
                    style={{
                      fontWeight: 800,
                      color: "var(--color-brand)",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.95rem",
                      flexShrink: 0,
                      minWidth: "3rem",
                    }}
                  >
                    {item.year}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {item.event}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why AreaSorted is different */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">Why switch</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Built differently from the start
            </h2>
            <p className="lead" style={{ marginTop: "0.8rem" }}>
              AreaSorted avoids the structural problems that brought down Handy.com and similar platforms.
            </p>
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
              More categories than Handy ever offered
            </h2>
            <p className="lead" style={{ marginTop: "0.8rem" }}>
              Handy.com covered cleaning and handyman. AreaSorted adds four more service categories Londoners regularly need.
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

      {/* The worker classification angle */}
      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow" style={{ color: "var(--color-error)" }}>How Handy.com worked</div>
            <h3 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(1.2rem, 2vw, 1.5rem)" }}>
              Controlled workers, called them contractors
            </h3>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: 1.7, paddingLeft: "1.2rem", marginTop: "0.8rem" }}>
              <li>Set worker pay rates and schedules</li>
              <li>Penalised workers for declining jobs</li>
              <li>Controlled customer relationships</li>
              <li>Workers had no pricing autonomy</li>
              <li>Resulted in lawsuits and FTC action</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">How AreaSorted works</div>
            <h3 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(1.2rem, 2vw, 1.5rem)" }}>
              Independent providers, proper business relationships
            </h3>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: 1.7, paddingLeft: "1.2rem", marginTop: "0.8rem" }}>
              <li>Providers set their own pricing</li>
              <li>Providers manage their own availability</li>
              <li>Providers operate as registered businesses</li>
              <li>Clear booking fee and commission structure</li>
              <li>Sustainable model for all parties</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section muted-block">
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
      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: 660 }}>
          <h2 className="title">Ready to switch?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.6 }}>
            Enter your postcode to check coverage and get an instant quote across all six service categories.
            All work is carried out by vetted local professionals through AreaSorted.
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
