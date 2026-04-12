import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { jobTypeCatalog, serviceCatalog } from "@/lib/service-catalog";
import { boroughPages, getBoroughPage } from "@/lib/seo/borough-pages";
import { boroughServiceContent, getBoroughServiceContent } from "@/lib/seo/borough-service-content";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

type Props = {
  params: Promise<{ borough: string; service: string }>;
};

function getSafeSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://areasorted.com";
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://areasorted.com";
  }
}

const serviceSlugs = boroughServiceContent.map((s) => s.slug);

export async function generateStaticParams() {
  const params: Array<{ borough: string; service: string }> = [];
  for (const borough of boroughPages) {
    for (const service of serviceSlugs) {
      params.push({ borough: borough.slug, service });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { borough, service } = await params;
  const page = getBoroughPage(borough);
  const content = getBoroughServiceContent(service);
  if (!page || !content) return {};

  const serviceLabel = content.label;

  return {
    title: `${serviceLabel} Services in ${page.name}`,
    description: `Book ${serviceLabel.toLowerCase()} services in ${page.name}, London through AreaSorted. Check coverage, compare options, understand pricing factors, and continue booking online.`,
    alternates: {
      canonical: `/london/${page.slug}/${content.slug}`,
    },
    openGraph: {
      title: `${serviceLabel} Services in ${page.name} | AreaSorted`,
      description: `Compare ${serviceLabel.toLowerCase()} services in ${page.name}, London with clear pricing, postcode-first coverage checks, and managed booking through AreaSorted.`,
    },
  };
}

export default async function BoroughServicePage({ params }: Props) {
  const { borough, service } = await params;

  const page = getBoroughPage(borough);
  const content = getBoroughServiceContent(service);
  if (!page || !content) notFound();

  const enabledServiceValues = await getEnabledServiceValues();
  if (!enabledServiceValues.includes(content.service)) notFound();

  const serviceJobs = jobTypeCatalog.filter((job) => job.service === content.service);
  const startingPrice = serviceJobs.length > 0 ? Math.min(...serviceJobs.map((job) => job.startingPrice)) : 0;

  const faqItems = content.faqItems(page.name);
  const siteUrl = getSafeSiteUrl();

  const catalogEntry = serviceCatalog.find((s) => s.value === content.service);

  // Other services in this borough for cross-linking
  const otherServices = boroughServiceContent.filter(
    (s) => s.slug !== content.slug && enabledServiceValues.includes(s.service)
  );

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

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${content.label} services in ${page.name}`,
    description: `Book ${content.label.toLowerCase()} services in ${page.name}, London through AreaSorted.`,
    areaServed: {
      "@type": "AdministrativeArea",
      name: page.name,
      containedInPlace: {
        "@type": "City",
        name: "London",
      },
    },
    provider: {
      "@type": "Organization",
      name: "AreaSorted",
      url: siteUrl,
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "London", item: `${siteUrl}/london` },
      { "@type": "ListItem", position: 3, name: page.name, item: `${siteUrl}/london/${page.slug}` },
      { "@type": "ListItem", position: 4, name: content.label, item: `${siteUrl}/london/${page.slug}/${content.slug}` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">{content.eyebrow}</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            {content.label} services in {page.name}
          </h1>
          <p className="lead">
            {content.leadDescription(page.name)}
          </p>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[
              `${serviceJobs.length} ${content.label.toLowerCase()} job types`,
              `From ${formatMoney(startingPrice)}`,
              `Areas near ${page.nearbyAreas[0]}`,
            ].map((item) => (
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
            <Link className="button button-secondary" href={`/services/${content.slug}`}>{content.label} services guide</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">Why customers book here</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>{content.label} demand in {page.name}</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              {content.demandDescription(page.name, page.highlights)}
            </p>
          </div>
          <div className="panel card">
            <div className="eyebrow">Popular {content.label.toLowerCase()} needs</div>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              {content.popularNeeds.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What affects price</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Pricing factors for {content.label.toLowerCase()} in {page.name}</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              {content.pricingFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Nearby areas</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Neighbourhoods customers often compare</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.7 }}>
              Customers searching for {content.label.toLowerCase()} in {page.name} often also compare options in{" "}
              {page.nearbyAreas.join(", ")}. Coverage stays postcode-led, so the fastest next step is still to start
              with your exact address.
            </p>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">{content.label} FAQ</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Common questions about {content.label.toLowerCase()} in {page.name}</h2>
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

      {otherServices.length > 0 ? (
        <section className="section">
          <div className="container" style={{ maxWidth: 860 }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div className="eyebrow">Other services in {page.name}</div>
              <h2 className="title" style={{ marginTop: "0.6rem" }}>Explore more local services</h2>
            </div>
            <div className="grid-3" style={{ gap: "0.8rem" }}>
              {otherServices.map((s) => (
                <Link
                  key={s.slug}
                  href={`/london/${page.slug}/${s.slug}`}
                  className="panel card"
                  style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}
                >
                  <strong>{s.label}</strong>
                  <p style={{ marginTop: "0.3rem", color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    {s.label} in {page.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section muted-block">
        <div className="container" style={{ textAlign: "center", maxWidth: 700 }}>
          <h2 className="title">Ready to book {content.label.toLowerCase()} in {page.name}?</h2>
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
