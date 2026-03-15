import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { listPricingAreaOverrides, listPricingAuditLogs, listProviderPricingRules, previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { deletePricingConfigAction, disablePricingConfigAction, saveAreaOverrideAction, saveMarketplaceSettingAction, savePricingConfigAction } from "./actions";

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

export default async function AdminPricingPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const providers = await prisma.providerCompany.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pricingRules: true,
      coverageAreas: true,
    },
  });

  const bookingFeeSetting = await prisma.adminSetting.findUnique({ where: { key: "marketplace.booking_fee" } });
  const commissionSetting = await prisma.adminSetting.findUnique({ where: { key: "marketplace.commission_percent" } });
  const auditLogs = providers[0] ? await listPricingAuditLogs(providers[0].id) : [];
  const areaOverrides = providers[0] ? await listPricingAreaOverrides(providers[0].id) : [];
  const preview = providers[0]
    ? await previewProviderPricing({
        providerCompanyId: providers[0].id,
        categoryKey: providers[0].pricingRules[0]?.categoryKey || "CLEANING",
        serviceKey: providers[0].pricingRules[0]?.serviceKey || "regular-home-cleaning",
        postcodePrefix: providers[0].coverageAreas[0]?.postcodePrefix || "SW6",
        estimatedHours: 3,
        quantity: 1,
        sameDay: false,
        weekend: false,
      }).catch(() => null)
    : null;

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 880, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>Pricing control</h1>
          <p className="lead">Manage provider pricing, area-level overrides, platform booking fee, and commission behavior.</p>
        </div>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Platform fee settings</div>
          <div className="section-card-grid" style={{ marginTop: "1rem" }}>
            <form action={saveMarketplaceSettingAction} className="span-6 admin-filter-grid">
              <input type="hidden" name="key" value="marketplace.booking_fee" />
              <label className="quote-field-stack admin-filter-span-8">
                <span>Default booking fee</span>
                <input type="number" step="0.01" name="value" defaultValue={String((bookingFeeSetting?.valueJson as any)?.value ?? 12)} />
              </label>
              <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-primary" type="submit">Save booking fee</button></div>
            </form>
            <form action={saveMarketplaceSettingAction} className="span-6 admin-filter-grid">
              <input type="hidden" name="key" value="marketplace.commission_percent" />
              <label className="quote-field-stack admin-filter-span-8">
                <span>Default commission percent</span>
                <input type="number" step="0.01" name="value" defaultValue={String((commissionSetting?.valueJson as any)?.value ?? 18)} />
              </label>
              <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-primary" type="submit">Save commission</button></div>
            </form>
          </div>
        </section>

        {preview ? (
          <section className="panel card" style={{ marginBottom: "1.5rem" }}>
            <div className="eyebrow">Interactive preview example</div>
            <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
              <div><span>Provider base price</span><strong>{formatMoney(preview.providerBasePrice)}</strong></div>
              <div><span>Booking fee</span><strong>{formatMoney(preview.bookingFee)}</strong></div>
              <div><span>Commission / application fee</span><strong>{formatMoney(preview.commissionAmount)}</strong></div>
              <div><span>Postcode surcharge</span><strong>{formatMoney(preview.postcodeSurcharge)}</strong></div>
              <div><span>Total customer pay</span><strong>{formatMoney(preview.totalCustomerPay)}</strong></div>
              <div><span>Expected provider payout before Stripe fees</span><strong>{formatMoney(preview.expectedProviderPayoutBeforeStripeFees)}</strong></div>
              <div><span>Quote required</span><strong>{preview.quoteRequired ? "Yes" : "No"}</strong></div>
            </div>
          </section>
        ) : null}

        {providers.map((provider) => (
          <section key={provider.id} className="panel card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <div className="eyebrow">{provider.companyNumber}</div>
              <strong style={{ fontSize: "1.2rem" }}>{provider.tradingName || provider.legalName}</strong>
            </div>

            <section className="panel-soft" style={{ padding: "1rem", marginBottom: "1rem", display: "grid", gap: "1rem" }}>
              <div className="eyebrow">Create or update provider pricing rule</div>
              <form action={savePricingConfigAction} className="admin-filter-grid">
                <input type="hidden" name="providerCompanyId" value={provider.id} />
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

            <section className="panel-soft" style={{ padding: "1rem", marginBottom: "1rem", display: "grid", gap: "1rem" }}>
              <div className="eyebrow">Area-level override</div>
              <form action={saveAreaOverrideAction} className="admin-filter-grid">
                <input type="hidden" name="providerCompanyId" value={provider.id} />
                <label className="quote-field-stack admin-filter-span-3"><span>Category</span><input name="categoryKey" placeholder="CLEANING" /></label>
                <label className="quote-field-stack admin-filter-span-3"><span>Postcode prefix</span><input name="postcodePrefix" placeholder="SW6" /></label>
                <label className="quote-field-stack admin-filter-span-2"><span>Surcharge</span><input type="number" step="0.01" name="surchargeAmount" /></label>
                <label className="quote-field-stack admin-filter-span-2"><span>Booking fee override</span><input type="number" step="0.01" name="bookingFeeOverride" /></label>
                <label className="quote-field-stack admin-filter-span-2"><span>Commission % override</span><input type="number" step="0.01" name="commissionPercentOverride" /></label>
                <label className="quote-field-stack admin-filter-span-2"><span>Active</span><label className="quote-check-item" style={{ minHeight: 52 }}><input type="checkbox" name="active" defaultChecked /><span>Enable</span></label></label>
                <div className="admin-filter-actions" style={{ marginTop: 0 }}><button className="button button-primary" type="submit">Save area override</button></div>
              </form>
            </section>

            <div style={{ display: "grid", gap: "1rem" }}>
              {provider.pricingRules.map((rule) => (
                <section key={rule.id} className="panel-soft" style={{ padding: "1rem" }}>
                  <div style={{ marginBottom: "1rem" }}><strong>{rule.categoryKey} / {rule.serviceKey}</strong></div>
                  <form action={savePricingConfigAction} className="admin-filter-grid">
                    <input type="hidden" name="providerCompanyId" value={provider.id} />
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
                      <button className="button button-primary" type="submit">Save</button>
                    </div>
                  </form>
                  <div className="button-row" style={{ marginTop: "1rem" }}>
                    <form action={disablePricingConfigAction}><input type="hidden" name="providerPricingRuleId" value={rule.id} /><button className="button button-secondary" type="submit">Disable</button></form>
                    <form action={deletePricingConfigAction}><input type="hidden" name="providerPricingRuleId" value={rule.id} /><button className="button button-secondary" type="submit">Delete</button></form>
                  </div>
                </section>
              ))}
            </div>
          </section>
        ))}

        <section className="panel card">
          <div className="eyebrow">Pricing audit trail</div>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            {auditLogs.map((log) => (
              <div key={log.id}><span>{log.action}</span><strong>{new Date(log.createdAt).toLocaleString()}</strong></div>
            ))}
          </div>
          {areaOverrides.length ? (
            <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
              {areaOverrides.map((override) => (
                <div key={override.id}><span>{override.categoryKey} / {override.postcodePrefix}</span><strong>{formatMoney(Number(override.surchargeAmount))}</strong></div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
