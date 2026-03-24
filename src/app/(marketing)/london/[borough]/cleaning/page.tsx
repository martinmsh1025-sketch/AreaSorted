import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { getBoroughPage } from "@/lib/seo/borough-pages";

type Props = {
  params: Promise<{ borough: string }>;
};

const supportedBoroughs = ["camden", "islington", "westminster"] as const;

const cleaningJobs = jobTypeCatalog.filter((job) => job.service === "cleaning");
const startingPrice = Math.min(...cleaningJobs.map((job) => job.startingPrice));

function isSupportedBorough(slug: string): slug is (typeof supportedBoroughs)[number] {
  return supportedBoroughs.includes(slug as (typeof supportedBoroughs)[number]);
}

export async function generateStaticParams() {
  return supportedBoroughs.map((borough) => ({ borough }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { borough } = await params;
  if (!isSupportedBorough(borough)) {
    return {};
  }

  const page = getBoroughPage(borough);
  if (!page) {
    return {};
  }

  return {
    title: `Cleaning Services in ${page.name}`,
    description: `Book cleaning services in ${page.name}, London through AreaSorted. Check coverage, compare cleaning options, understand pricing factors, and continue booking online.`,
    alternates: {
      canonical: `/london/${page.slug}/cleaning`,
    },
    openGraph: {
      title: `Cleaning Services in ${page.name} | AreaSorted`,
      description: `Compare cleaning services in ${page.name}, London with clear pricing, postcode-first coverage checks, and managed booking through AreaSorted.`,
    },
  };
}

export default async function BoroughCleaningPage({ params }: Props) {
  const { borough } = await params;
  if (!isSupportedBorough(borough)) notFound();

  const page = getBoroughPage(borough);
  if (!page) notFound();

  const faqItems = [
    {
      question: `What cleaning services can I book in ${page.name}?`,
      answer: `AreaSorted supports regular home cleaning, end of tenancy cleaning, carpet and upholstery cleaning, appliance cleaning, window cleaning, and targeted room deep cleans in ${page.name}.`,
    },
    {
      question: `What affects cleaning prices in ${page.name}?`,
      answer: `Cleaning prices depend on job type, property size, property type, cleaning condition, timing, postcode, and add-ons such as oven cleaning or inside windows.`,
    },
    {
      question: `How does booking work for cleaning in ${page.name}?`,
      answer: `Start with your postcode, review the cleaning quote, and continue with a temporary card hold. Payment is only captured once the booking is confirmed.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
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
          <div className="eyebrow">Local cleaning</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Cleaning services in {page.name}
          </h1>
          <p className="lead">
            Book cleaning services in {page.name} through AreaSorted with postcode-first coverage checks, clearer pricing, and managed booking confirmation.
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[`${cleaningJobs.length} cleaning job types`, `From ${formatMoney(startingPrice)}`, `Areas near ${page.nearbyAreas[0]}`].map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", minHeight: 38, padding: "0.55rem 0.85rem", borderRadius: 999, border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", fontSize: "0.92rem", fontWeight: 600 }}>
                {item}
              </span>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/services/cleaning">Cleaning services guide</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">Why customers book here</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Cleaning demand in {page.name}</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              {page.name} customers often book cleaning for {page.highlights.join(", ").toLowerCase()}. AreaSorted helps turn that into a clearer flow by checking coverage first, showing pricing before checkout, and managing confirmation through one place.
            </p>
          </div>
          <div className="panel card">
            <div className="eyebrow">Popular cleaning needs</div>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Regular home cleaning for weekly or fortnightly routines</li>
              <li>End of tenancy cleaning for move-outs and handovers</li>
              <li>Deep cleaning before guests, inspections, or returns to market</li>
              <li>Specialist cleaning add-ons such as ovens, carpets, or internal windows</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What affects price</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Pricing factors for cleaning in {page.name}</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              <li>Property size and type</li>
              <li>Cleaning condition and amount of work needed</li>
              <li>Urgency, weekend, and evening timing</li>
              <li>Postcode and access considerations</li>
              <li>Add-ons such as oven cleaning or inside windows</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Nearby areas</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Neighbourhoods customers often compare</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Customers searching for cleaning in {page.name} often also compare options in {page.nearbyAreas.join(", ")}. Coverage stays postcode-led, so the fastest next step is still to start with your exact address.
            </p>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">Cleaning FAQ</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common questions about cleaning in {page.name}</h2>
          </div>
          <div style={{ display: "grid", gap: "1rem" }}>
            {faqItems.map((item) => (
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
          <h2 className="title">Ready to book cleaning in {page.name}?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
            Check your postcode, compare the quote, and continue to booking when you are ready.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.4rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href={`/london/${page.slug}`}>More about {page.name}</Link>
            <Link className="button button-secondary" href="/pricing">See pricing</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
