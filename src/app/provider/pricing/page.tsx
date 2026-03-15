import { redirect } from "next/navigation";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import { getProviderCompanyById } from "@/lib/providers/repository";
import { listPricingAuditLogs, listPricingAreaOverrides, listProviderPricingRules, previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { deleteProviderPricingAction, disableProviderPricingAction, saveProviderAreaOverrideAction, saveProviderPricingAction } from "./actions";

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
  const providerCompanyId = await getProviderSessionCompanyId();
  if (!providerCompanyId) redirect("/provider/login");

  const params = (await searchParams) ?? {};

  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) redirect("/provider/login");

  const [pricingRules, areaOverrides, auditLogs] = await Promise.all([
    listProviderPricingRules(providerCompanyId),
    listPricingAreaOverrides(providerCompanyId),
    listPricingAuditLogs(providerCompanyId),
  ]);

  const previewCategory = typeof params.previewCategory === "string" ? params.previewCategory : pricingRules[0]?.categoryKey;
  const previewService = typeof params.previewService === "string" ? params.previewService : pricingRules[0]?.serviceKey;
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
        <div style={{ maxWidth: 900, marginBottom: "2rem" }}>
          <div className="eyebrow">Provider portal</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>Pricing portal</h1>
          <p className="lead">Set provider base pricing, uplifts, postcode overrides, and custom quote behavior for your services.</p>
        </div>

        {preview ? (
          <section className="panel card" style={{ marginBottom: "1.5rem" }}>
            <div className="eyebrow">Preview example</div>
            <form method="get" className="admin-filter-grid" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <label className="quote-field-stack admin-filter-span-3"><span>Category</span><input name="previewCategory" defaultValue={previewCategory || ""} /></label>
              <label className="quote-field-stack admin-filter-span-3"><span>Service key</span><input name="previewService" defaultValue={previewService || ""} /></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Postcode prefix</span><input name="previewPostcode" defaultValue={previewPostcode} /></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Hours</span><input type="number" step="0.5" name="previewHours" defaultValue={String(previewHours)} /></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Quantity</span><input type="number" step="1" name="previewQuantity" defaultValue={String(previewQuantity)} /></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Same-day</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="previewSameDay" defaultChecked={previewSameDay} /><span>Yes</span></label></label>
              <label className="quote-field-stack admin-filter-span-2"><span>Weekend</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="previewWeekend" defaultChecked={previewWeekend} /><span>Yes</span></label></label>
              <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-secondary" type="submit">Run preview</button></div>
            </form>
            <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
              <div><span>Provider base price</span><strong>{formatMoney(preview.providerBasePrice)}</strong></div>
              <div><span>Booking fee</span><strong>{formatMoney(preview.bookingFee)}</strong></div>
              <div><span>Commission / application fee</span><strong>{formatMoney(preview.commissionAmount)}</strong></div>
              <div><span>Postcode surcharge</span><strong>{formatMoney(preview.postcodeSurcharge)}</strong></div>
              <div><span>Total customer pay</span><strong>{formatMoney(preview.totalCustomerPay)}</strong></div>
              <div><span>Expected provider payout before Stripe fees</span><strong>{formatMoney(preview.expectedProviderPayoutBeforeStripeFees)}</strong></div>
              <div><span>Custom quote required</span><strong>{preview.quoteRequired ? "Yes" : "No"}</strong></div>
            </div>
          </section>
        ) : null}

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Create or update pricing rule</div>
          <form action={saveProviderPricingAction} className="admin-filter-grid" style={{ marginTop: "1rem" }}>
            <label className="quote-field-stack admin-filter-span-3"><span>Category</span><input name="categoryKey" placeholder="CLEANING" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Service key</span><input name="serviceKey" placeholder="regular-home-cleaning" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Pricing mode</span><select name="pricingMode" defaultValue="flat"><option value="flat">flat</option><option value="hourly">hourly</option><option value="minimum">minimum</option></select></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Flat price</span><input type="number" step="0.01" name="flatPrice" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Hourly price</span><input type="number" step="0.01" name="hourlyPrice" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Minimum charge</span><input type="number" step="0.01" name="minimumCharge" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Travel fee</span><input type="number" step="0.01" name="travelFee" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Same-day uplift</span><input type="number" step="0.01" name="sameDayUplift" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Weekend uplift</span><input type="number" step="0.01" name="weekendUplift" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Custom quote required</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="customQuoteRequired" /><span>Enable</span></label></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Active</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="active" defaultChecked /><span>Enable</span></label></label>
            <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-primary" type="submit">Save pricing rule</button></div>
          </form>
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Postcode / zone overrides</div>
          <form action={saveProviderAreaOverrideAction} className="admin-filter-grid" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <label className="quote-field-stack admin-filter-span-3"><span>Category</span><input name="categoryKey" placeholder="CLEANING" /></label>
            <label className="quote-field-stack admin-filter-span-3"><span>Postcode prefix</span><input name="postcodePrefix" placeholder="SW6" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Surcharge</span><input type="number" step="0.01" name="surchargeAmount" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Booking fee override</span><input type="number" step="0.01" name="bookingFeeOverride" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Commission % override</span><input type="number" step="0.01" name="commissionPercentOverride" /></label>
            <label className="quote-field-stack admin-filter-span-2"><span>Active</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="active" defaultChecked /><span>Enable</span></label></label>
            <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-primary" type="submit">Save area override</button></div>
          </form>
          <div className="quote-summary-list">
            {areaOverrides.map((override) => (
              <div key={override.id}><span>{override.categoryKey} / {override.postcodePrefix}</span><strong>{formatMoney(Number(override.surchargeAmount))}</strong></div>
            ))}
          </div>
        </section>

        <div className="admin-table-shell" style={{ display: "grid", gap: "1rem" }}>
          {pricingRules.map((rule) => (
            <section key={rule.id} className="panel card">
              <div style={{ marginBottom: "1rem" }}>
                <div className="eyebrow">{rule.categoryKey}</div>
                <strong style={{ fontSize: "1.2rem" }}>{rule.serviceKey}</strong>
              </div>

              <form action={saveProviderPricingAction} className="admin-filter-grid">
                <input type="hidden" name="categoryKey" value={rule.categoryKey} />
                <input type="hidden" name="serviceKey" value={rule.serviceKey} />
                <label className="quote-field-stack admin-filter-span-3"><span>Pricing mode</span><select name="pricingMode" defaultValue={rule.pricingMode}><option value="flat">flat</option><option value="hourly">hourly</option><option value="minimum">minimum</option></select></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Flat price</span><input type="number" step="0.01" name="flatPrice" defaultValue={inputValue(rule.flatPrice)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Hourly price</span><input type="number" step="0.01" name="hourlyPrice" defaultValue={inputValue(rule.hourlyPrice)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Minimum charge</span><input type="number" step="0.01" name="minimumCharge" defaultValue={inputValue(rule.minimumCharge)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Travel fee</span><input type="number" step="0.01" name="travelFee" defaultValue={inputValue(rule.travelFee)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Same-day uplift</span><input type="number" step="0.01" name="sameDayUplift" defaultValue={inputValue(rule.sameDayUplift)} /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Weekend uplift</span><input type="number" step="0.01" name="weekendUplift" defaultValue={inputValue(rule.weekendUplift)} /></label>
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
          <div className="eyebrow">Recent pricing changes</div>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            {auditLogs.map((log) => (
              <div key={log.id}><span>{log.action}</span><strong>{new Date(log.createdAt).toLocaleString()}</strong></div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
