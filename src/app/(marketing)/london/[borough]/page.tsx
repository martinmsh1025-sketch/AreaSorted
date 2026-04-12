import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { boroughPages, getBoroughPage } from "@/lib/seo/borough-pages";
import { boroughServiceContent } from "@/lib/seo/borough-service-content";

type Props = {
  params: Promise<{ borough: string }>;
};

export async function generateStaticParams() {
  return boroughPages.map((page) => ({ borough: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { borough } = await params;
  const page = getBoroughPage(borough);
  if (!page) {
    return {};
  }

  return {
    title: `${page.name} Local Services`,
    description: `${page.intro} Explore booking expectations, common jobs, and service coverage in ${page.name}, London.`,
    alternates: {
      canonical: `/london/${page.slug}`,
    },
  };
}

function getSafeSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://areasorted.com";
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://areasorted.com";
  }
}

export default async function BoroughPage({ params }: Props) {
  const { borough } = await params;
  const page = getBoroughPage(borough);
  if (!page) notFound();

  const siteUrl = getSafeSiteUrl();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "AreaSorted",
    url: siteUrl,
    logo: `${siteUrl}/images/brand/areasorted-logo.png`,
    areaServed: {
      "@type": "City",
      name: "London",
      containsPlace: {
        "@type": "AdministrativeArea",
        name: page.name,
      },
    },
    description: `Book trusted local services in ${page.name}, London — cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance through AreaSorted.`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Local services in ${page.name}`,
      itemListElement: [
        "Cleaning", "Pest Control", "Handyman", "Furniture Assembly", "Waste Removal", "Garden Maintenance",
      ].map((service) => ({
        "@type": "OfferCatalog",
        name: service,
        itemOffered: {
          "@type": "Service",
          name: `${service} in ${page.name}`,
          areaServed: page.name,
        },
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "London", item: `${siteUrl}/london` },
      { "@type": "ListItem", position: 3, name: page.name, item: `${siteUrl}/london/${page.slug}` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">London coverage</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Local services in {page.name}
          </h1>
          <p className="lead">{page.intro}</p>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Continue booking</Link>
            <Link className="button button-secondary" href="/services">Browse services</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div className="eyebrow">Services in {page.name}</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Explore local services</h2>
          </div>
          <div className="grid-3" style={{ gap: "0.8rem" }}>
            {boroughServiceContent.map((s) => (
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

      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">Why this page matters</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Booking in {page.name}</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
              AreaSorted is built for London postcode matching. When you start a booking in {page.name}, we check
              local coverage, service suitability, timing, and pricing before you continue. We place a temporary card
              hold first, and only capture payment once the provider confirms the booking.
            </p>
          </div>
          <div className="panel card">
            <div className="eyebrow">Common booking traits</div>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              {page.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">Popular jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What customers often book in {page.name}</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              {page.commonJobs.map((job) => (
                <li key={job}>{job}</li>
              ))}
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Nearby areas</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Neighbourhoods we also think about</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
              Customers searching in {page.name} often also compare options in nearby areas such as {page.nearbyAreas.join(", ")}. Coverage is always postcode-led, so the fastest next step is to continue booking and check your exact address.
            </p>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container" style={{ textAlign: "center", maxWidth: 700 }}>
          <h2 className="title">Ready to check coverage in {page.name}?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
            Start with your postcode, review your service options, and continue booking when you are ready.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.4rem" }}>
            <Link className="button button-primary" href="/quote">Continue booking</Link>
            <Link className="button button-secondary" href="/pricing">See pricing</Link>
            <Link className="button button-secondary" href="/faq">Read FAQ</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
