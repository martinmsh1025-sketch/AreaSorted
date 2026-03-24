import type { Metadata } from "next";
import Link from "next/link";
import { serviceCatalog, jobTypeCatalog } from "@/lib/service-catalog";

export const metadata: Metadata = {
  title: "Services — Cleaning, Pest Control, Handyman & More",
  description:
    "Browse 57 bookable service types across cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance. All services arranged through AreaSorted in London.",
  openGraph: {
    title: "Services — Cleaning, Pest Control, Handyman & More | AreaSorted",
    description:
      "Browse 57 bookable service types across 6 categories. All services arranged through AreaSorted and carried out by vetted London providers.",
  },
};

const categoryIcons: Record<string, string> = {
  cleaning: "🧹",
  "pest-control": "🐛",
  handyman: "🔧",
  "furniture-assembly": "📦",
  "waste-removal": "🗑️",
  "garden-maintenance": "🌿",
};

const bookingModeLabels: Record<string, string> = {
  fixed: "Fixed price",
  estimate: "Quoted estimate",
  inspection: "Inspection first",
};

const detailedServicePages: Partial<Record<string, string>> = {
  cleaning: "/services/cleaning",
  "pest-control": "/services/pest-control",
  handyman: "/services/handyman",
  "furniture-assembly": "/services/furniture-assembly",
  "waste-removal": "/services/waste-removal",
  "garden-maintenance": "/services/garden-maintenance",
};

export default function ServicesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Our services</div>
          <h1 className="display" style={{ marginTop: "0.65rem", fontSize: "clamp(2.2rem, 3.4vw, 3.5rem)", maxWidth: 760 }}>
            Trusted local services across London, all in one place.
          </h1>
          <p className="lead" style={{ marginTop: "0.95rem", maxWidth: 760 }}>
            Browse cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance services, then get a clear quote based on your area and job details.
          </p>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.8rem", lineHeight: 1.7, maxWidth: 760 }}>
            We support bookings across all 32 London boroughs and make it easier to compare service options, understand pricing, and continue to booking without chasing separate quotes.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", marginTop: "1.25rem" }}>
            {[
              `${serviceCatalog.length} service categories`,
              `${jobTypeCatalog.length} bookable job types`,
              "Coverage across London",
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
                  color: "var(--color-text)",
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
            <Link className="button button-secondary" href="/faq">How booking works</Link>
          </div>
        </div>
      </section>

      {/* Category overview */}
      <section className="section muted-block">
        <div className="container">
          <div className="grid-3" style={{ gap: "1.2rem" }}>
            {serviceCatalog.map((cat) => {
              const jobCount = jobTypeCatalog.filter((j) => j.service === cat.value).length;
              const prices = jobTypeCatalog.filter((j) => j.service === cat.value).map((j) => j.startingPrice);
              const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
              return (
                <a
                  key={cat.value}
                  href={detailedServicePages[cat.value] ?? `#${cat.value}`}
                  className="panel card"
                  style={{ textDecoration: "none", color: "inherit", padding: "1.35rem 1.4rem" }}
                >
                  <div style={{ fontSize: "2.1rem", lineHeight: 1, marginBottom: "0.7rem" }}>
                    {categoryIcons[cat.value] ?? "📋"}
                  </div>
                  <strong style={{ fontSize: "1.03rem" }}>{cat.label}</strong>
                  <p style={{ color: "var(--color-text-muted)", margin: "0.45rem 0 0", fontSize: "0.92rem", lineHeight: 1.6 }}>
                    {cat.strapline}
                  </p>
                  <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.84rem", color: "var(--color-text-muted)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}><strong style={{ color: "var(--color-text)" }}>{jobCount}</strong> job types</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>From <strong style={{ color: "var(--color-text)" }}>£{lowestPrice}</strong></span>
                  </div>
                  {detailedServicePages[cat.value] ? (
                    <div style={{ marginTop: "1rem" }}>
                      <span style={{ color: "var(--color-brand)", fontWeight: 700, fontSize: "0.9rem" }}>Learn more</span>
                    </div>
                  ) : null}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed listings per category */}
      {serviceCatalog.map((cat) => {
        const jobs = jobTypeCatalog.filter((j) => j.service === cat.value);
        return (
          <section key={cat.value} id={cat.value} className="section">
            <div className="container">
              <div style={{ marginBottom: "2rem" }}>
                <div className="eyebrow">{categoryIcons[cat.value] ?? "📋"} {cat.label}</div>
                <h2 className="title" style={{ marginTop: "0.6rem" }}>{cat.strapline}</h2>
                <p style={{ color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                  {jobs.length} job types across {cat.subcategories.length} subcategories. 
                  All services arranged through AreaSorted.
                </p>
                {detailedServicePages[cat.value] ? (
                  <p style={{ marginTop: "0.7rem" }}>
                    <Link href={detailedServicePages[cat.value]!} style={{ color: "var(--color-brand)", fontWeight: 700 }}>
                      Read the full {cat.label.toLowerCase()} guide
                    </Link>
                  </p>
                ) : null}
                <p style={{ color: "var(--color-text-muted)", marginTop: "0.7rem", lineHeight: 1.6, maxWidth: 860 }}>
                  Looking for {cat.label.toLowerCase()} in London? Use AreaSorted to check postcode coverage,
                  compare job sizes, understand what affects pricing, and continue booking with a temporary
                  card hold before provider confirmation.
                </p>
              </div>

              {/* Subcategory groups */}
              {cat.subcategories.map((sub) => {
                const subJobs = jobs.filter((j) => j.subcategory === sub.value);
                if (subJobs.length === 0) return null;
                return (
                  <div key={sub.value} style={{ marginBottom: "2rem" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.8rem", fontFamily: "var(--font-display)" }}>
                      {sub.label}
                    </h3>
                    <div className="grid-2" style={{ gap: "1rem" }}>
                      {subJobs.map((job) => (
                        <div key={job.value} className="panel card" style={{ padding: "1.2rem 1.4rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ display: "block", marginBottom: "0.3rem" }}>{job.label}</strong>
                              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
                                {job.strapline}
                              </p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-brand)" }}>
                                £{job.startingPrice}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>starting</div>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.6rem",
                              marginTop: "0.8rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-surface-muted)",
                                border: "1px solid var(--color-border)",
                                fontSize: "0.78rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {bookingModeLabels[job.bookingMode] ?? job.bookingMode}
                            </span>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-surface-muted)",
                                border: "1px solid var(--color-border)",
                                fontSize: "0.78rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {job.sizeOptions.length} size options
                            </span>
                            {job.addOns.length > 0 && (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "var(--radius-sm)",
                                  background: "var(--color-surface-muted)",
                                  border: "1px solid var(--color-border)",
                                  fontSize: "0.78rem",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                {job.addOns.length} add-ons
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="section muted-block">
        <div className="container" style={{ textAlign: "center", maxWidth: 660 }}>
          <h2 className="title">Ready to book?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.6 }}>
            Enter your postcode to check coverage and get an instant quote for any of the {jobTypeCatalog.length} services above.
          </p>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.6 }}>
            You can also review <Link href="/how-it-works" style={{ color: "var(--color-brand)", fontWeight: 600 }}>how booking works</Link>, compare <Link href="/services/cleaning" style={{ color: "var(--color-brand)", fontWeight: 600 }}>cleaning</Link>, <Link href="/services/handyman" style={{ color: "var(--color-brand)", fontWeight: 600 }}>handyman</Link>, or <Link href="/services/pest-control" style={{ color: "var(--color-brand)", fontWeight: 600 }}>pest control</Link> options, or visit the <Link href="/faq" style={{ color: "var(--color-brand)", fontWeight: 600 }}>help centre</Link> before continuing.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/pricing">View pricing</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
