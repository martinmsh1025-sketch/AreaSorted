import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

const cleaningJobs = jobTypeCatalog.filter((job) => job.service === "cleaning");
const startingPrice = Math.min(...cleaningJobs.map((job) => job.startingPrice));

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
  title: "Cleaning Services in London",
  description:
    "Book cleaning services in London through AreaSorted, including regular home cleaning, end of tenancy cleaning, specialist cleaning, appliance cleaning, and room deep cleans.",
  alternates: {
    canonical: "/services/cleaning",
  },
  openGraph: {
    title: "Cleaning Services in London | AreaSorted",
    description:
      "Browse cleaning services in London, understand what affects pricing, and continue to booking with a clear quote and managed confirmation flow.",
  },
};

const popularJobs = cleaningJobs.slice(0, 6);

const faqs = [
  {
    question: "What cleaning services can I book?",
    answer:
      "AreaSorted supports regular home cleaning, end of tenancy cleaning, carpet and upholstery cleaning, appliance cleaning, window cleaning, and room deep cleans.",
  },
  {
    question: "What affects cleaning prices?",
    answer:
      "Cleaning quotes depend on job type, property size, property type, condition, timing, postcode, and any extras such as oven cleaning or inside windows.",
  },
  {
    question: "Do cleaners bring their own supplies?",
    answer:
      "This depends on the cleaning job. Some bookings let you choose whether to provide supplies or have the provider bring them, which can affect pricing.",
  },
  {
    question: "When am I charged for cleaning services?",
    answer:
      "AreaSorted places a temporary card hold when you continue booking and captures payment only once the booking is confirmed.",
  },
];

export default async function CleaningServicePage() {
  const enabledServiceValues = await getEnabledServiceValues();
  if (!enabledServiceValues.includes("cleaning")) notFound();
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
    name: "Cleaning services in London",
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
      { "@type": "ListItem", position: 3, name: "Cleaning", item: `${siteUrl}/services/cleaning` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Cleaning services</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Cleaning services in London with clear pricing and managed booking.
          </h1>
          <p className="lead">
            Book regular home cleaning, end of tenancy cleaning, specialist cleaning, appliance cleaning, and room deep cleans through one structured AreaSorted flow.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[`${cleaningJobs.length} cleaning job types`, `From ${formatMoney(startingPrice)}`, "Coverage across London"].map((item) => (
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
            <Link className="button button-secondary" href="/pricing">See cleaning pricing</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What this covers</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Cleaning jobs customers commonly book</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Regular home cleaning for weekly, fortnightly, or one-off visits</li>
              <li>End of tenancy cleaning for move-outs and property handovers</li>
              <li>Carpet and upholstery cleaning for fabrics and soft furnishings</li>
              <li>Appliance cleaning for ovens, fridges, and internal deep cleans</li>
              <li>Window cleaning and targeted room deep cleans</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Who it suits</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Homes, rentals, and practical move-in or move-out needs</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Cleaning bookings are often used by busy households, landlords, tenants, agents, and customers preparing for handovers, guests, inspections, or a deeper one-off reset.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Popular cleaning jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What customers search for most</h2>
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
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What affects your cleaning quote</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Property size and property type</li>
              <li>Cleaning condition and level of work required</li>
              <li>Urgency, weekend, and evening timing</li>
              <li>Postcode and area-related adjustments</li>
              <li>Add-ons such as carpet cleaning, oven cleaning, or inside windows</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">How booking works</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>From postcode to confirmed cleaning slot</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Start with your postcode, select the cleaning job and size, review the quote, and continue with a temporary card hold. Payment is only captured once the booking is confirmed.
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
            <div className="eyebrow">Cleaning FAQ</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common questions about cleaning services</h2>
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
          <h2 className="title">Ready to compare cleaning options in London?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
            Check your area, review the quote, and continue to booking when you are ready.
          </p>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
            You can also explore local cleaning pages for{" "}
            <Link href="/london/camden/cleaning" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Camden</Link>,{" "}
            <Link href="/london/islington/cleaning" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Islington</Link>,{" "}
            <Link href="/london/westminster/cleaning" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Westminster</Link>,{" "}
            <Link href="/london/hackney/cleaning" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Hackney</Link>,{" "}
            <Link href="/london/lambeth/cleaning" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Lambeth</Link>,{" "}
            and <Link href="/london" style={{ color: "var(--color-brand)", fontWeight: 600 }}>more London boroughs</Link>.
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
