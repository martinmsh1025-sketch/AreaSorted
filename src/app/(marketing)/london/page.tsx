import type { Metadata } from "next";
import Image from "next/image";
import { boroughPages } from "@/lib/seo/borough-pages";

export const metadata: Metadata = {
  title: "London Areas We Cover",
  description:
    "Check AreaSorted London coverage for cleaning, handyman work, pest control, waste removal, furniture assembly, and garden maintenance from one clear area page.",
  alternates: {
    canonical: "/london",
  },
};

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
              Use this single London coverage page to check where AreaSorted operates. Coverage is postcode-led, so
              the most accurate next step is still to enter the exact service address before booking.
            </p>
          </div>
          <div className="services-hero-art london-hero-art">
            <Image src="/images/marketing-generated/london-map-hero.png" alt="London coverage map" fill className="services-hero-art-image" sizes="(max-width: 960px) 100vw, 42vw" />
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
            <div className="eyebrow">Coverage guide</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>London boroughs covered</h2>
            <p style={{ color: "var(--color-text-muted)", margin: "0.6rem auto 0", maxWidth: 720, lineHeight: 1.7 }}>
              Borough names are shown for guidance only. We do not use separate borough pages; every booking starts
              with an exact postcode check so availability, access, timing, and service fit can be confirmed properly.
            </p>
          </div>
          <div className="grid-3" style={{ gap: "1rem" }}>
            {boroughPages.map((page) => (
              <div
                key={page.slug}
                className="panel card"
                style={{ padding: "1.1rem 1.2rem" }}
              >
                <strong>{page.name}</strong>
                <p style={{ marginTop: "0.45rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  Local reference points: {page.nearbyAreas.join(", ")}.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
