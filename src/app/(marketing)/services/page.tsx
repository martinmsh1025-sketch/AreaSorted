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

export default function ServicesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Our services</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            {serviceCatalog.length} service categories. {jobTypeCatalog.length} bookable job types.
          </h1>
          <p className="lead">
            Every service is arranged through AreaSorted and carried out by an independent, vetted provider 
            in your area. Browse the full catalogue below, then get a quote in minutes.
          </p>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Continue booking</Link>
          </div>
        </div>
      </section>

      {/* Category overview */}
      <section className="section muted-block">
        <div className="container">
          <div className="grid-3" style={{ gap: "1.2rem" }}>
            {serviceCatalog.map((cat) => {
              const jobCount = jobTypeCatalog.filter((j) => j.service === cat.value).length;
              const lowestPrice = Math.min(
                ...jobTypeCatalog.filter((j) => j.service === cat.value).map((j) => j.startingPrice),
              );
              return (
                <a
                  key={cat.value}
                  href={`#${cat.value}`}
                  className="panel card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }}>
                    {categoryIcons[cat.value] ?? "📋"}
                  </div>
                  <strong>{cat.label}</strong>
                  <p style={{ color: "var(--color-text-muted)", margin: "0.3rem 0 0", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    {cat.strapline}
                  </p>
                  <div style={{ marginTop: "0.8rem", display: "flex", gap: "1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <span><strong style={{ color: "var(--color-text)" }}>{jobCount}</strong> job types</span>
                    <span>From <strong style={{ color: "var(--color-text)" }}>£{lowestPrice}</strong></span>
                  </div>
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
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Continue booking</Link>
            <Link className="button button-secondary" href="/pricing">View pricing</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
