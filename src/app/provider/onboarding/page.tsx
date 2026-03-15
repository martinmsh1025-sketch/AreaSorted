import { redirect } from "next/navigation";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import { getProviderCompanyById } from "@/lib/providers/repository";
import { providerServiceCategoryOptions, providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { saveProviderProfileAction, signProviderAgreementAction } from "./actions";
import { startStripeOnboardingAction, syncStripeStatusAction } from "@/app/provider/dashboard/actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";

export default async function ProviderOnboardingPage() {
  const providerCompanyId = await getProviderSessionCompanyId();
  if (!providerCompanyId) redirect("/provider/login");

  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) redirect("/provider/login");

  const selectedCategories = provider.serviceCategories.map((item) => item.categoryKey);
  const selectedPostcodes = Array.from(new Set(provider.coverageAreas.map((item) => item.postcodePrefix))).join(", ");
  const agreementSigned = provider.agreements.some((agreement) => agreement.status === "SIGNED");
  const checklist = buildProviderChecklist(provider);

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 900, marginBottom: "2rem" }}>
          <div className="eyebrow">Provider onboarding</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>Complete your company setup</h1>
          <p className="lead">Set up company details, service coverage, agreement status, and Stripe Connect onboarding.</p>
        </div>

        <section className="section-card-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Current status</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.4rem" }}>{providerStatusLabels[provider.status] || provider.status}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Provider onboarding stage</p>
          </div>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Agreement</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.4rem" }}>{agreementSigned ? "Signed" : "Pending"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Platform agreement status</p>
          </div>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Stripe</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.4rem" }}>{provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "Ready" : "Pending"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Payments and payouts readiness</p>
          </div>
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Activation checklist</div>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            {checklist.items.map((item) => (
              <div key={item.key}><span>{item.label}</span><strong>{item.complete ? "Done" : "Missing"}</strong></div>
            ))}
          </div>
          {!checklist.allComplete ? (
            <p className="lead" style={{ marginTop: "1rem", marginBottom: 0 }}>
              Missing: {checklist.missingLabels.join(", ")}
            </p>
          ) : (
            <p className="lead" style={{ marginTop: "1rem", marginBottom: 0 }}>
              All onboarding requirements are complete. This provider can be activated when Stripe is ready.
            </p>
          )}
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Company profile</div>
          <form action={saveProviderProfileAction} className="admin-filter-grid" style={{ marginTop: "1rem" }}>
            <label className="quote-field-stack admin-filter-span-6">
              <span>Legal company name</span>
              <input name="legalName" defaultValue={provider.legalName} />
            </label>
            <label className="quote-field-stack admin-filter-span-6">
              <span>Trading name</span>
              <input name="tradingName" defaultValue={provider.tradingName || ""} />
            </label>
            <label className="quote-field-stack admin-filter-span-4">
              <span>Company number</span>
              <input name="companyNumber" defaultValue={provider.companyNumber} />
            </label>
            <label className="quote-field-stack admin-filter-span-4">
              <span>Contact email</span>
              <input name="contactEmail" type="email" defaultValue={provider.contactEmail} />
            </label>
            <label className="quote-field-stack admin-filter-span-4">
              <span>Phone</span>
              <input name="phone" defaultValue={provider.phone} />
            </label>
            <label className="quote-field-stack admin-filter-span-6">
              <span>Registered address</span>
              <input name="registeredAddress" defaultValue={provider.registeredAddress} />
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>VAT number</span>
              <input name="vatNumber" defaultValue={provider.vatNumber || ""} />
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>Insurance expiry</span>
              <input type="date" name="insuranceExpiry" defaultValue={provider.insuranceExpiry ? provider.insuranceExpiry.toISOString().slice(0, 10) : ""} />
            </label>
            <label className="quote-field-stack admin-filter-span-6">
              <span>Service categories</span>
              <input name="categories" defaultValue={selectedCategories.join(", ")} placeholder={providerServiceCategoryOptions.map((item) => item.key).join(", ")} />
            </label>
            <label className="quote-field-stack admin-filter-span-6">
              <span>Postcode prefixes</span>
              <input name="postcodePrefixes" defaultValue={selectedPostcodes} placeholder="SW6, W1, N1" />
            </label>
            <label className="quote-field-stack admin-filter-span-12">
              <span>Compliance notes</span>
              <textarea name="complianceNotes" rows={4} defaultValue={provider.complianceNotes || ""} />
            </label>
            <div className="admin-filter-actions" style={{ marginTop: 0 }}>
              <button type="submit" className="button button-primary">Save provider profile</button>
            </div>
          </form>
        </section>

        <section className="section-card-grid">
          <div className="span-6 panel card">
            <div className="eyebrow">Agreement</div>
            <p className="lead">Sign the platform agreement before moving to final activation.</p>
            <form action={signProviderAgreementAction}>
              <button className="button button-primary" type="submit">Mark agreement signed</button>
            </form>
          </div>

          <div className="span-6 panel card">
            <div className="eyebrow">Stripe Connect</div>
            <p className="lead">Complete Connect onboarding and then sync the latest account state.</p>
            <div className="button-row">
              <form action={startStripeOnboardingAction}>
                <button className="button button-primary" type="submit">Open Stripe onboarding</button>
              </form>
              <form action={syncStripeStatusAction}>
                <button className="button button-secondary" type="submit">Sync Stripe status</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
