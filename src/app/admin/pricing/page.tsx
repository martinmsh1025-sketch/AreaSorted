import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listPricingConfigs } from "@/lib/pricing-config-store";
import { savePricingConfigAction } from "./actions";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function AdminPricingPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const pricing = await listPricingConfigs();

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 880, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>Pricing control</h1>
          <p className="lead">
            Review provider-submitted base prices, add platform markup, and apply admin override pricing where needed.
          </p>
        </div>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="section-card-grid">
            <div className="span-4 admin-stat-card">
              <div className="eyebrow">Rows</div>
              <strong className="admin-stat-number">{pricing.length}</strong>
              <p className="lead" style={{ marginBottom: 0 }}>Job pricing records</p>
            </div>
            <div className="span-4 admin-stat-card">
              <div className="eyebrow">Average provider base</div>
              <strong className="admin-stat-number">{formatMoney(pricing.reduce((sum, row) => sum + row.providerBasePrice, 0) / Math.max(pricing.length, 1))}</strong>
              <p className="lead" style={{ marginBottom: 0 }}>Current provider-side baseline</p>
            </div>
            <div className="span-4 admin-stat-card">
              <div className="eyebrow">Average sell price</div>
              <strong className="admin-stat-number">{formatMoney(pricing.reduce((sum, row) => sum + row.preview.finalSellPrice, 0) / Math.max(pricing.length, 1))}</strong>
              <p className="lead" style={{ marginBottom: 0 }}>Current customer-facing average</p>
            </div>
          </div>
        </section>

        <div className="admin-table-shell" style={{ display: "grid", gap: "1rem" }}>
          {pricing.map((row) => (
            <section key={row.jobType} className="panel card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <div>
                  <div className="eyebrow">{row.service} / {row.subcategory}</div>
                  <strong style={{ fontSize: "1.2rem" }}>{row.label}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="eyebrow">Live sell price</div>
                  <strong style={{ fontSize: "1.3rem" }}>{formatMoney(row.preview.finalSellPrice)}</strong>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>Margin {formatMoney(row.preview.margin)}</div>
                </div>
              </div>

              <form action={savePricingConfigAction} className="admin-filter-grid">
                <input type="hidden" name="jobType" value={row.jobType} />
                <label className="quote-field-stack admin-filter-span-3">
                  <span>Provider base</span>
                  <input type="number" step="0.01" name="providerBasePrice" defaultValue={row.providerBasePrice} />
                </label>
                <label className="quote-field-stack admin-filter-span-3">
                  <span>Markup %</span>
                  <input type="number" step="0.01" name="markupPercent" defaultValue={row.markupPercent} />
                </label>
                <label className="quote-field-stack admin-filter-span-3">
                  <span>Markup fixed</span>
                  <input type="number" step="0.01" name="markupFixed" defaultValue={row.markupFixed} />
                </label>
                <label className="quote-field-stack admin-filter-span-3">
                  <span>Booking fee</span>
                  <input type="number" step="0.01" name="bookingFee" defaultValue={row.bookingFee} />
                </label>
                <label className="quote-field-stack admin-filter-span-4">
                  <span>Admin override final price</span>
                  <input type="number" step="0.01" name="adminOverridePrice" defaultValue={row.adminOverridePrice ?? ""} placeholder="Leave blank to use calculated price" />
                </label>
                <label className="quote-field-stack admin-filter-span-4">
                  <span>Calculated final price</span>
                  <input value={formatMoney(row.preview.computedSellPrice)} readOnly aria-readonly="true" />
                </label>
                <label className="quote-field-stack admin-filter-span-4">
                  <span>Active</span>
                  <label className="quote-check-item" style={{ minHeight: 52 }}>
                    <input type="checkbox" name="active" defaultChecked={row.active} />
                    <span>{row.active ? "Enabled for quoting" : "Disabled"}</span>
                  </label>
                </label>
                <div className="admin-filter-actions" style={{ marginTop: 0 }}>
                  <button className="button button-primary" type="submit">Save pricing</button>
                </div>
              </form>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
