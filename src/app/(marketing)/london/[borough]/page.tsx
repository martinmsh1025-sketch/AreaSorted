import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
    description: `${page.intro} ${page.localAngle} Explore booking expectations, common jobs, and service coverage in ${page.name}, London.`,
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

const eastNorthEastBoroughs = new Set(["hackney", "tower-hamlets", "newham", "waltham-forest", "redbridge", "havering", "barking-dagenham", "enfield", "camden", "islington", "barnet", "haringey"]);

function getBoroughHeroImage(slug: string) {
  return eastNorthEastBoroughs.has(slug)
    ? "/images/marketing-generated/london-east-grid.png"
    : "/images/marketing-generated/london-west-grid.png";
}

const serviceCardImages: Record<string, string> = {
  cleaning: "/images/homepage/services/cleaning.jpg",
  "pest-control": "/images/homepage/services/pest-control.jpg",
  handyman: "/images/homepage/services/handyman-better.jpg",
  "furniture-assembly": "/images/homepage/services/furniture-assembly-better.jpg",
  "waste-removal": "/images/homepage/services/waste-removal.jpg",
  "garden-maintenance": "/images/homepage/services/garden-maintenance-better.jpg",
};

function sentenceIndex(slug: string, count: number) {
  return slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % count;
}

function getBoroughBookingCopy(page: NonNullable<ReturnType<typeof getBoroughPage>>) {
  const flowSentences = [
    "That means we check exact postcode, access notes, service fit, and timing before treating the booking as ready for provider confirmation.",
    "The flow is deliberately address-led: local availability is checked first, and payment is only captured after provider confirmation.",
    "Instead of assuming one borough behaves the same throughout, we use the job details and address context to reduce bad-fit bookings.",
  ];

  return `${page.localAngle} ${page.bookingReality} ${flowSentences[sentenceIndex(page.slug, flowSentences.length)]}`;
}

function getServiceCardCopy(service: (typeof boroughServiceContent)[number], page: NonNullable<ReturnType<typeof getBoroughPage>>) {
  const firstNeed = service.popularNeeds[0].replace(/\.$/, "").toLowerCase();
  return `${firstNeed}, with local fit checked around ${page.nearbyAreas[0]} and ${page.nearbyAreas[1]}.`;
}

function getNearbyAreaCopy(page: NonNullable<ReturnType<typeof getBoroughPage>>) {
  const areas = page.nearbyAreas.join(", ");
  return `Use ${areas} as reference points rather than fixed service boundaries. ${page.pricingContext} Coverage is postcode-led, so the most accurate next step is to check the exact address.`;
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
        <div className="container services-hero-grid" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow">London coverage</div>
            <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
              Local services in {page.name}
            </h1>
            <p className="lead">{page.localAngle}</p>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.75rem", lineHeight: 1.7 }}>{page.bookingReality}</p>
            <div className="button-row" style={{ marginTop: "1.5rem" }}>
              <Link className="button button-primary" href="/quote">Continue booking</Link>
              <Link className="button button-secondary" href="/services">Browse services</Link>
            </div>
          </div>
          <div className="services-hero-art borough-hero-art">
            <Image src={getBoroughHeroImage(page.slug)} alt={`${page.name} borough coverage illustration`} fill className="services-hero-art-image" sizes="(max-width: 960px) 100vw, 42vw" />
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
                style={{ textDecoration: "none", color: "inherit", textAlign: "center", overflow: "hidden", padding: 0 }}
              >
                <div className="borough-service-card-media">
                  <Image src={serviceCardImages[s.slug]} alt={s.label} fill className="borough-service-card-image" sizes="(max-width: 960px) 100vw, 33vw" />
                </div>
                <div style={{ padding: "1rem 1.1rem 1.15rem" }}>
                  <strong>{s.label}</strong>
                  <p style={{ marginTop: "0.3rem", color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    {getServiceCardCopy(s, page)}
                  </p>
                </div>
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
              {getBoroughBookingCopy(page)}
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
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Neighbourhoods that shape local demand</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
              {getNearbyAreaCopy(page)}
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
