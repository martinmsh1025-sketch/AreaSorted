import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { boroughPages } from "@/lib/seo/borough-pages";

const boroughCardImages: Record<string, string> = {
  hackney: "/images/borough-cards/hackney.png",
  "tower-hamlets": "/images/borough-cards/tower-hamlets.png",
  newham: "/images/borough-cards/newham.png",
  "waltham-forest": "/images/borough-cards/waltham-forest.png",
  redbridge: "/images/borough-cards/redbridge.png",
  havering: "/images/borough-cards/havering.png",
  "barking-dagenham": "/images/borough-cards/barking-dagenham.png",
  enfield: "/images/borough-cards/enfield.png",
  ealing: "/images/borough-cards/ealing.png",
  hounslow: "/images/borough-cards/hounslow.png",
  hillingdon: "/images/borough-cards/hillingdon.png",
  harrow: "/images/borough-cards/harrow.png",
  "richmond-upon-thames": "/images/borough-cards/richmond-upon-thames.png",
  "kingston-upon-thames": "/images/borough-cards/kingston-upon-thames.png",
  merton: "/images/borough-cards/merton.png",
  wandsworth: "/images/borough-cards/wandsworth.png",
  lambeth: "/images/borough-cards/lambeth.png",
  southwark: "/images/borough-cards/southwark.png",
  lewisham: "/images/borough-cards/lewisham.png",
  greenwich: "/images/borough-cards/greenwich.png",
  bexley: "/images/borough-cards/bexley.png",
  bromley: "/images/borough-cards/bromley.png",
  croydon: "/images/borough-cards/croydon.png",
  sutton: "/images/borough-cards/sutton.png",
  camden: "/images/borough-cards/southwark.png",
  islington: "/images/borough-cards/hounslow.png",
  westminster: "/images/borough-cards/greenwich.png",
  "kensington-chelsea": "/images/borough-cards/ealing.png",
  barnet: "/images/borough-cards/enfield.png",
  brent: "/images/borough-cards/croydon.png",
  "hammersmith-fulham": "/images/borough-cards/wandsworth.png",
  haringey: "/images/borough-cards/waltham-forest.png",
};

export const metadata: Metadata = {
  title: "London Areas We Cover",
  description:
    "Explore AreaSorted coverage across London boroughs and discover local service booking pages for cleaning, handyman work, pest control, waste removal, furniture assembly, and garden maintenance.",
  alternates: {
    canonical: "/london",
  },
};

function getBoroughCardCopy(page: (typeof boroughPages)[number]) {
  const [firstArea, secondArea] = page.nearbyAreas;
  return `${page.localAngle} We also factor in nearby patterns around ${firstArea} and ${secondArea}, not just the borough name.`;
}

export default function LondonCoverageHubPage() {
  return (
    <main>
      <section className="section">
        <div className="container services-hero-grid" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow">London coverage</div>
            <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
              London service areas
            </h1>
            <p className="lead">
              Browse borough-specific booking pages to understand how AreaSorted handles local services across London.
              Each page helps customers explore pricing expectations, booking flow, and common jobs in that borough.
            </p>
          </div>
          <div className="services-hero-art london-hero-art">
            <Image src="/images/marketing-generated/london-map-hero.png" alt="London coverage map" fill className="services-hero-art-image" sizes="(max-width: 960px) 100vw, 42vw" />
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container">
          <div className="grid-3" style={{ gap: "1rem" }}>
            {boroughPages.map((page) => (
              <Link
                key={page.slug}
                href={`/london/${page.slug}`}
                className="panel card"
                style={{ textDecoration: "none", color: "inherit", overflow: "hidden", padding: 0 }}
              >
                <div className="borough-card-media">
                  <Image src={boroughCardImages[page.slug]} alt={page.name} fill className="borough-card-media-image" sizes="(max-width: 960px) 100vw, 33vw" />
                </div>
                <div style={{ padding: "1.15rem 1.2rem 1.25rem" }}>
                  <strong>{page.name}</strong>
                  <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    {getBoroughCardCopy(page)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
