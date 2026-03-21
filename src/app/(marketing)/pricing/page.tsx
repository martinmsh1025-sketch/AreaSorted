import type { Metadata } from "next";
import Link from "next/link";
import {
  serviceCatalog,
  jobTypeCatalog,
  propertyTypeOptions,
  urgencyOptions,
} from "@/lib/service-catalog";

export const metadata: Metadata = {
  title: "Pricing — Transparent Service Pricing",
  description:
    "See starting prices for all 57 service types across cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance in London. No hidden fees.",
  openGraph: {
    title: "Pricing — Transparent Service Pricing | AreaSorted",
    description:
      "Transparent pricing for all 57 service types in London. See starting prices, add-ons, and fee breakdown before you book.",
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

const adjustments = [
  {
    title: "Property type",
    description: "Pricing adjusts based on property size and type.",
    items: propertyTypeOptions.map((o) => ({
      label: o.label,
      detail: o.priceDelta === 0 ? "Base price" : `+£${o.priceDelta}`,
    })),
  },
  {
    title: "Urgency",
    description: "Need it sooner? Priority and same-day options are available.",
    items: urgencyOptions.map((o) => ({
      label: o.label,
      detail: o.priceDelta === 0 ? "No surcharge" : `+£${o.priceDelta}`,
    })),
  },
  {
    title: "Timing surcharges",
    description: "Weekend and evening slots carry a small additional fee.",
    items: [
      { label: "Weekday (daytime)", detail: "No surcharge" },
      { label: "Weekend booking", detail: "+£18" },
      { label: "Evening slot", detail: "+£16" },
    ],
  },
];

export default function PricingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Pricing</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Transparent pricing with no hidden fees.
          </h1>
          <p className="lead">
            Every quote shows the full breakdown — base price, add-ons, adjustments, and booking fee — before you pay. 
            The price you see at checkout is the price you pay.
          </p>
        </div>
      </section>

      {/* How pricing works */}
      <section className="section muted-block">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="eyebrow">How pricing works</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Your quote is built from four components</h2>
          </div>
          <div className="grid-2" style={{ gap: "1.2rem", maxWidth: 900, margin: "0 auto" }}>
            {[
              {
                num: "1",
                title: "Base service price",
                desc: "Set by the service type and job size (small, standard, or large). This is the core cost of the work.",
              },
              {
                num: "2",
                title: "Add-ons & adjustments",
                desc: "Optional extras (oven clean, carpet clean, etc.) plus adjustments for property type, timing, and urgency.",
              },
              {
                num: "3",
                title: "Platform commission",
                desc: "A 12% commission is applied to cover platform operations. This is added to the service price, not deducted from the provider.",
              },
              {
                num: "4",
                title: "Booking fee",
                desc: "A fixed booking fee (typically £12–£19) covers payment processing, provider matching, and customer support.",
              },
            ].map((item) => (
              <div key={item.num} className="panel card" style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "50%",
                    background: "var(--color-brand)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {item.num}
                </div>
                <div>
                  <strong style={{ display: "block", marginBottom: "0.3rem" }}>{item.title}</strong>
                  <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.92rem", lineHeight: 1.55 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Starting prices by category */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">Starting prices</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Prices by service category
            </h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
              Starting prices shown are for the smallest job size at a flat/apartment. Final price depends on your specific requirements.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {serviceCatalog.map((cat) => {
              const jobs = jobTypeCatalog
                .filter((j) => j.service === cat.value)
                .sort((a, b) => a.startingPrice - b.startingPrice);
              const lowestPrice = jobs[0]?.startingPrice ?? 0;

              return (
                <div key={cat.value} className="panel card" style={{ padding: "1.6rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.8rem" }}>
                    <div>
                      <div style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>
                        {categoryIcons[cat.value]} <strong style={{ marginLeft: "0.3rem" }}>{cat.label}</strong>
                      </div>
                      <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.92rem" }}>
                        {cat.strapline}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>From</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-brand)", fontFamily: "var(--font-display)" }}>
                        £{lowestPrice}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "0.6rem",
                    }}
                  >
                    {jobs.map((job) => (
                      <div
                        key={job.value}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.6rem 0.8rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.9rem",
                        }}
                      >
                        <span>{job.label}</span>
                        <span style={{ fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                          £{job.startingPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Adjustments */}
      <section className="section muted-block">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="eyebrow">Price adjustments</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              What affects the final price?
            </h2>
          </div>
          <div className="grid-3" style={{ gap: "1.2rem" }}>
            {adjustments.map((group) => (
              <div key={group.title} className="panel card">
                <strong style={{ display: "block", marginBottom: "0.3rem" }}>{group.title}</strong>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", margin: "0 0 0.8rem" }}>
                  {group.description}
                </p>
                <ul className="list-clean" style={{ fontSize: "0.9rem" }}>
                  {group.items.map((item) => (
                    <li key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{item.label}</span>
                      <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cleaning condition note */}
      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Cleaning condition</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              For cleaning services, condition matters.
            </h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
              If a property needs extra attention, the cleaning condition multiplier adjusts the price accordingly. 
              This ensures providers are fairly compensated for heavier work.
            </p>
          </div>
          <div className="panel card">
            <ul className="list-clean" style={{ fontSize: "0.92rem" }}>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Light</span>
                <span style={{ fontWeight: 600 }}>5% discount</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Standard</span>
                <span style={{ fontWeight: 600 }}>Base price</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Heavy</span>
                <span style={{ fontWeight: 600 }}>+18%</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Very heavy</span>
                <span style={{ fontWeight: 600 }}>+38%</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Recurring discounts */}
      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Recurring bookings</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>
              Regular bookings cost less.
            </h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
              For cleaning services, setting up a recurring schedule reduces the price per visit.
            </p>
          </div>
          <div className="panel card">
            <ul className="list-clean" style={{ fontSize: "0.92rem" }}>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>One-off booking</span>
                <span style={{ fontWeight: 600 }}>Full price</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Monthly</span>
                <span style={{ fontWeight: 600 }}>Full price</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Fortnightly</span>
                <span style={{ fontWeight: 600 }}>5% discount</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Weekly</span>
                <span style={{ fontWeight: 600 }}>10% discount</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: 660 }}>
          <h2 className="title">Get your exact price in minutes</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.6 }}>
            Enter your postcode and job details. The pricing engine calculates your total with a full breakdown — 
            no surprises, no callbacks.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Continue booking</Link>
            <Link className="button button-secondary" href="/services">Browse all services</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
