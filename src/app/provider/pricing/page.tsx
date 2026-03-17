import { redirect } from "next/navigation";
import { requireProviderPricingAccess } from "@/lib/provider-auth";
import { listPricingAuditLogs, listPricingAreaOverrides, listProviderPricingRules, previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { deleteProviderPricingAction, disableProviderPricingAction, saveProviderAreaOverrideAction, saveProviderPricingAction } from "./actions";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { providerServiceCatalog } from "@/lib/providers/service-catalog-mapping";
import { getPrisma } from "@/lib/db";

type ProviderPricingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

function inputValue(value: unknown) {
  return value == null ? "" : String(value);
}

export default async function ProviderPricingPage({ searchParams }: ProviderPricingPageProps) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;
  const provider = session.providerCompany;

  const prisma = getPrisma();
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : "";

  const [pricingRules, areaOverrides, auditLogs, bookingFeeSetting, commissionSetting] = await Promise.all([
    listProviderPricingRules(providerCompanyId),
    listPricingAreaOverrides(providerCompanyId),
    listPricingAuditLogs(providerCompanyId),
    prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee" } }),
    prisma.adminSetting.findUnique({ where: { key: "marketplace.commission_percent" } }),
  ]);

  const bookingFee = Number((bookingFeeSetting?.valueJson as { value?: number } | null)?.value ?? 12);
  const commissionPercent = Number((commissionSetting?.valueJson as { value?: number } | null)?.value ?? 18);

  const approvedServiceKeys = provider.stripeRequirementsJson && typeof provider.stripeRequirementsJson === "object" && !Array.isArray(provider.stripeRequirementsJson) && Array.isArray((provider.stripeRequirementsJson as any).approvedServiceKeys)
    ? ((provider.stripeRequirementsJson as any).approvedServiceKeys as string[])
    : [];
  
  const providerCategoryKey = provider.serviceCategories[0]?.categoryKey || providerServiceCatalog[0]?.key || "CLEANING";
  const availableServices = providerServiceCatalog.find(c => c.key === providerCategoryKey)?.services || [];

  const previewCategory = typeof params.previewCategory === "string" ? params.previewCategory : pricingRules[0]?.categoryKey || providerCategoryKey;
  const previewService = typeof params.previewService === "string" ? params.previewService : pricingRules[0]?.serviceKey || approvedServiceKeys[0] || availableServices[0]?.key || "";
  const previewPostcode = typeof params.previewPostcode === "string" ? params.previewPostcode : provider.coverageAreas[0]?.postcodePrefix || "SW6";
  const previewHours = typeof params.previewHours === "string" ? Number(params.previewHours) : 3;
  const previewQuantity = typeof params.previewQuantity === "string" ? Number(params.previewQuantity) : 1;
  const previewSameDay = params.previewSameDay === "on";
  const previewWeekend = params.previewWeekend === "on";

  const preview = previewCategory && previewService
    ? await previewProviderPricing({
        providerCompanyId,
        categoryKey: previewCategory,
        serviceKey: previewService,
        postcodePrefix: previewPostcode,
        estimatedHours: previewHours,
        quantity: previewQuantity,
        sameDay: previewSameDay,
        weekend: previewWeekend,
      }).catch(() => null)
    : null;

  return (
    <main className="section">
      <div className="container">
        <section className="backoffice-hero-card" style={{ marginBottom: "1.5rem" }}>
          <div className="backoffice-hero-grid">
            <div>
              <div className="eyebrow">Provider portal</div>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.3rem, 4vw, 3.6rem)" }}>Pricing setup</h1>
              <p className="lead">Set provider base prices.</p>
              <div className="backoffice-chip-row">
                <ProviderStatusBadge status={provider.status} />
                <span className="backoffice-chip">Active rules: {pricingRules.filter((rule) => rule.active).length}</span>
                <span className="backoffice-chip backoffice-chip-muted">Coverage areas: {provider.coverageAreas.length}</span>
              </div>
              {status === "saved" ? <p style={{ color: "var(--color-success)", marginTop: "1rem", lineHeight: 1.6 }}>Pricing changes saved.</p> : null}
            </div>
            <div className="backoffice-hero-meta">
              <div className="backoffice-kpi-card">
                <span className="eyebrow">Activation gate</span>
                <strong>{pricingRules.some((rule) => rule.active) ? "Pricing ready" : "Need one active rule"}</strong>
                <span className="lead" style={{ margin: 0 }}>Need at least one active rule.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="backoffice-grid-2">
          <div className="backoffice-stack">
        {preview ? (
          <section className="panel card" style={{ marginBottom: "1.5rem" }}>
            <div className="backoffice-section-head">
              <div>
                  <div className="eyebrow">Preview</div>
                  <p className="lead">Check customer total and provider payout.</p>
              </div>
            </div>
            <form method="get" className="admin-filter-grid" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <label className="quote-field-stack admin-filter-span-3"><span>Category</span><input name="previewCategory" defaultValue={previewCategory || ""} readOnly /></label>
              <label className="quote-field-stack admin-filter-span-3">
                <span>Service key</span>
                <select name="previewService" defaultValue={previewService || ""}>
                  {availableServices.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="quote-field-stack admin-filter-span-2"><span>Postcode prefix</span><input name="previewPostcode" defaultValue={previewPostcode} /></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Hours</span><input type="number" step="0.5" name="previewHours" defaultValue={String(previewHours)} /></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Quantity</span><input type="number" step="1" name="previewQuantity" defaultValue={String(previewQuantity)} /></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Same-day</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="previewSameDay" defaultChecked={previewSameDay} /><span>Yes</span></label></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Weekend</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="previewWeekend" defaultChecked={previewWeekend} /><span>Yes</span></label></label>
              <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-secondary" type="submit">Run preview</button></div>
            </form>
            <div className="backoffice-data-list" style={{ marginTop: "1rem" }}>
              <div className="backoffice-data-row"><span>Provider base price</span><strong>{formatMoney(preview.providerBasePrice)}</strong></div>
              <div className="backoffice-data-row"><span>Booking fee (Customer pays platform)</span><strong>{formatMoney(preview.bookingFee)}</strong></div>
              <div className="backoffice-data-row"><span>Commission ({commissionPercent}%)</span><strong style={{ color: "var(--color-error)" }}>-{formatMoney(preview.commissionAmount)}</strong></div>
              <div className="backoffice-data-row"><span>Postcode surcharge</span><strong>{formatMoney(preview.postcodeSurcharge)}</strong></div>
              <div className="backoffice-data-row"><span>Total customer pay</span><strong>{formatMoney(preview.totalCustomerPay)}</strong></div>
              <div className="backoffice-data-row" style={{ background: "#f0fdf4" }}><span>Expected Provider Payout</span><strong style={{ color: "var(--color-success)", fontSize: "1.1rem" }}>{formatMoney(preview.expectedProviderPayoutBeforeStripeFees)}</strong></div>
              <div className="backoffice-data-row"><span>Custom quote required</span><strong>{preview.quoteRequired ? "Yes" : "No"}</strong></div>
            </div>
          </section>
        ) : null}

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Create or update pricing rule</div>
                  <p className="lead">Save one rule per service.</p>
                </div>
              </div>
          <form action={saveProviderPricingAction} className="admin-filter-grid" style={{ marginTop: "1rem" }}>
            <label className="quote-field-stack admin-filter-span-3"><span>Category</span><input name="categoryKey" defaultValue={providerCategoryKey} readOnly /></label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>Service key</span>
              <select name="serviceKey">
                {availableServices.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="quote-field-stack admin-filter-span-3"><span>Pricing mode</span><select name="pricingMode" defaultValue="flat"><option value="flat">flat</option><option value="hourly">hourly</option><option value="minimum">minimum</option></select></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Flat price (£)</span><input type="number" step="0.01" name="flatPrice" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Hourly price (£/hr)</span><input type="number" step="0.01" name="hourlyPrice" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Minimum charge (£)</span><input type="number" step="0.01" name="minimumCharge" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Travel fee (£)</span><input type="number" step="0.01" name="travelFee" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Same-day uplift (£)</span><input type="number" step="0.01" name="sameDayUplift" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Weekend uplift (£)</span><input type="number" step="0.01" name="weekendUplift" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Custom quote required</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="customQuoteRequired" /><span>Enable</span></label></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Active</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="active" defaultChecked /><span>Enable</span></label></label>
            <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-primary" type="submit">Save pricing rule</button></div>
          </form>
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Postcode / zone overrides</div>
                  <p className="lead">Optional local overrides.</p>
                </div>
              </div>
          <form action={saveProviderAreaOverrideAction} className="admin-filter-grid" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <label className="quote-field-stack admin-filter-span-3"><span>Category</span><input name="categoryKey" defaultValue={providerCategoryKey} readOnly /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Postcode prefix</span><input name="postcodePrefix" placeholder="SW6" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Surcharge (£)</span><input type="number" step="0.01" name="surchargeAmount" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Booking fee override (£)</span><input type="number" step="0.01" name="bookingFeeOverride" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Commission % override</span><input type="number" step="0.01" name="commissionPercentOverride" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Active</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="active" defaultChecked /><span>Enable</span></label></label>
            <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-primary" type="submit">Save area override</button></div>
          </form>
          <div className="backoffice-data-list">
            {areaOverrides.map((override) => (
              <div key={override.id} className="backoffice-data-row"><span>{override.categoryKey} / {override.postcodePrefix}</span><strong>{formatMoney(Number(override.surchargeAmount))}</strong></div>
            ))}
          </div>
        </section>

          </div>

          <div className="backoffice-stack">
            <section className="panel card" style={{ background: "#f8fafc", borderColor: "#86efac", marginBottom: "1.5rem" }}>
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow" style={{ color: "#166534" }}>Platform Fees</div>
                  <h2 style={{ fontSize: "1.4rem", margin: "0.5rem 0", color: "#166534" }}>Platform fees</h2>
                </div>
              </div>
              <div className="backoffice-data-list" style={{ marginTop: "0.5rem" }}>
                <div className="backoffice-data-row"><span>Platform Commission</span><strong style={{ color: "#166534" }}>{commissionPercent}%</strong></div>
                <div className="backoffice-data-row"><span>Customer Booking Fee</span><strong style={{ color: "#166534" }}>{formatMoney(bookingFee)}</strong></div>
              </div>
              <p className="lead" style={{ marginTop: "1rem", color: "#15803d", fontSize: "0.95rem" }}>Booking fee is added on top. Commission is deducted from provider base price.</p>
            </section>

            <section className="panel card">
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Pricing readiness</div>
                  <p className="lead">Go-live check.</p>
                </div>
              </div>
              <div className="backoffice-note-list">
                <div><strong>Active pricing rules</strong><p>{pricingRules.filter((rule) => rule.active).length} currently active</p></div>
                <div><strong>Area overrides</strong><p>{areaOverrides.length} override {areaOverrides.length === 1 ? "exists" : "entries exist"}</p></div>
                <div><strong>Next step</strong><p>{pricingRules.some((rule) => rule.active) ? "Pricing gate satisfied." : "Add one active rule."}</p></div>
              </div>
            </section>
          </div>
        </section>

        <div className="admin-table-shell" style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
          {pricingRules.map((rule) => (
            <section key={rule.id} className="panel card">
              <div className="backoffice-section-head">
                <div>
                <div className="eyebrow">{rule.categoryKey}</div>
                <strong style={{ fontSize: "1.2rem" }}>{availableServices.find(s => s.key === rule.serviceKey)?.label || rule.serviceKey}</strong>
                </div>
                <span className={`status-badge ${rule.active ? "status-badge-active" : "status-badge-legacy"}`}>{rule.active ? "Active" : "Disabled"}</span>
              </div>

              <form action={saveProviderPricingAction} className="admin-filter-grid">
                <input type="hidden" name="categoryKey" value={rule.categoryKey} />
                <input type="hidden" name="serviceKey" value={rule.serviceKey} />
                <label className="quote-field-stack admin-filter-span-3"><span>Pricing mode</span><select name="pricingMode" defaultValue={rule.pricingMode}><option value="flat">flat</option><option value="hourly">hourly</option><option value="minimum">minimum</option></select></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Flat price (£)</span><input type="number" step="0.01" name="flatPrice" defaultValue={inputValue(rule.flatPrice)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Hourly price (£/hr)</span><input type="number" step="0.01" name="hourlyPrice" defaultValue={inputValue(rule.hourlyPrice)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Minimum charge (£)</span><input type="number" step="0.01" name="minimumCharge" defaultValue={inputValue(rule.minimumCharge)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Travel fee (£)</span><input type="number" step="0.01" name="travelFee" defaultValue={inputValue(rule.travelFee)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Same-day uplift (£)</span><input type="number" step="0.01" name="sameDayUplift" defaultValue={inputValue(rule.sameDayUplift)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Weekend uplift (£)</span><input type="number" step="0.01" name="weekendUplift" defaultValue={inputValue(rule.weekendUplift)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Custom quote required</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="customQuoteRequired" defaultChecked={rule.customQuoteRequired} /><span>{rule.customQuoteRequired ? "Enabled" : "Disabled"}</span></label></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Active</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="active" defaultChecked={rule.active} /><span>{rule.active ? "Enabled" : "Disabled"}</span></label></label>
                <div className="button-row admin-filter-actions" style={{ marginTop: 0 }}>
                  <button className="button button-primary" type="submit">Save pricing</button>
                </div>
              </form>

              <div className="button-row" style={{ marginTop: "1rem" }}>
                <form action={disableProviderPricingAction}>
                  <input type="hidden" name="providerPricingRuleId" value={rule.id} />
                  <button className="button button-secondary" type="submit">Disable</button>
                </form>
                <form action={deleteProviderPricingAction}>
                  <input type="hidden" name="providerPricingRuleId" value={rule.id} />
                  <button className="button button-secondary" type="submit">Delete</button>
                </form>
              </div>
            </section>
          ))}
        </div>

        <section className="panel card" style={{ marginTop: "1.5rem" }}>
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Recent pricing changes</div>
              <p className="lead">Useful when you want to confirm what changed during setup.</p>
            </div>
          </div>
          <div className="backoffice-data-list" style={{ marginTop: "1rem" }}>
            {auditLogs.map((log) => (
              <div key={log.id} className="backoffice-data-row"><span>{log.action}</span><strong>{new Date(log.createdAt).toLocaleString()}</strong></div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
