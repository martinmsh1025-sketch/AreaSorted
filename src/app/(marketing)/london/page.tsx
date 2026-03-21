import type { Metadata } from "next";
import Link from "next/link";
import { boroughPages } from "@/lib/seo/borough-pages";

export const metadata: Metadata = {
  title: "London Areas We Cover",
  description:
    "Explore AreaSorted coverage across London boroughs and discover local service booking pages for cleaning, handyman work, pest control, waste removal, furniture assembly, and garden maintenance.",
};

export default function LondonCoverageHubPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="eyebrow">London coverage</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            London service areas
          </h1>
          <p className="lead">
            Browse borough-specific booking pages to understand how AreaSorted handles local services across London.
            Each page helps customers explore pricing expectations, booking flow, and common jobs in that borough.
          </p>
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
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <strong>{page.name}</strong>
                <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  {page.intro}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
