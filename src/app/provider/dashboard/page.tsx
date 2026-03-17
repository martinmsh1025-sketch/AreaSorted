import { redirect } from "next/navigation";
import { requireProviderSession } from "@/lib/provider-auth";
import { providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { canProviderAccessDashboard, canProviderAccessPricing, canProviderAccessStripe } from "@/lib/providers/status";
import { startStripeOnboardingAction, syncStripeStatusAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { ProviderStatusBadge } from "@/components/providers/status-badge";

type ProviderDashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderDashboardPage({ searchParams }: ProviderDashboardPageProps) {
  const session = await requireProviderSession();
  const provider = session.providerCompany;
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const status = typeof params.status === "string" ? params.status : "";

  const checklist = buildProviderChecklist(provider);
  const stripeUnlocked = canProviderAccessStripe(provider.status);
  const pricingUnlocked = canProviderAccessPricing(provider.status);
  const fullDashboard = canProviderAccessDashboard(provider.status);

  if (!stripeUnlocked && !fullDashboard) {
    redirect("/provider/onboarding");
  }

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 900, marginBottom: "2rem" }}>
          <section className="backoffice-hero-card">
            <div className="backoffice-hero-grid">
              <div>
                <div className="eyebrow">Payment account setup</div>
                <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.3rem, 4vw, 3.6rem)" }}>{provider.tradingName || provider.legalName || provider.contactEmail}</h1>
                <p className="lead">Connect Stripe and enable charges and payouts.</p>
                <div className="backoffice-chip-row">
                  <ProviderStatusBadge status={provider.status} />
                  <span className="backoffice-chip">Pricing: {pricingUnlocked ? "Unlocked" : "Locked"}</span>
                  <span className="backoffice-chip backoffice-chip-muted">Payouts: {provider.stripeConnectedAccount?.payoutsEnabled ? "Enabled" : "Pending"}</span>
                </div>
              </div>
              <div className="backoffice-hero-meta">
                <div className="backoffice-kpi-card">
                  <span className="eyebrow">Current phase</span>
                  <strong>{providerStatusLabels[provider.status] || provider.status}</strong>
                  <span className="lead" style={{ margin: 0 }}>Current status</span>
                </div>
              </div>
            </div>
          </section>
          {error ? <p style={{ color: "var(--color-error)", marginTop: "1rem", lineHeight: 1.6 }}>Stripe onboarding error: {error}</p> : null}
          {status === "synced" ? <p style={{ color: "var(--color-success)", marginTop: "1rem", lineHeight: 1.6 }}>Stripe status synced successfully.</p> : null}
        </div>

        <section className="backoffice-metric-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Provider state</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{providerStatusLabels[provider.status] || provider.status}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Provider status</p>
          </div>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Stripe charges</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{provider.stripeConnectedAccount?.chargesEnabled ? "Enabled" : "Pending"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Charge capability</p>
          </div>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Stripe payouts</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{provider.stripeConnectedAccount?.payoutsEnabled ? "Enabled" : "Pending"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Payout capability</p>
          </div>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Pricing</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{pricingUnlocked ? "Unlocked" : "Locked"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Unlocked after Stripe</p>
          </div>
        </section>

        <section className="backoffice-grid-2">
          <div className="backoffice-stack">
            <section className="panel card">
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Stripe Connect</div>
                  <p className="lead">Start onboarding or sync status.</p>
                </div>
              </div>
              <div className="button-row">
                <form action={startStripeOnboardingAction}>
                  <FormSubmitButton label="Start Stripe onboarding" pendingLabel="Opening Stripe" disabled={!stripeUnlocked} />
                </form>
                <form action={syncStripeStatusAction}>
                  <FormSubmitButton className="button button-secondary" label="Sync Stripe status" pendingLabel="Syncing Stripe" disabled={!stripeUnlocked} />
                </form>
              </div>
            </section>

            <section className="panel card">
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Readiness summary</div>
                  <p className="lead">Current checks.</p>
                </div>
              </div>
              <div className="backoffice-checklist-grid">
                {checklist.items.map((item) => (
                  <div key={item.key} className="backoffice-checklist-item">
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.complete ? "Completed" : item.detail}</p>
                    </div>
                    <span className={`status-badge ${item.complete ? "status-badge-active" : "status-badge-wip"}`}>{item.complete ? "Done" : "Open"}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="backoffice-stack">
            <section className="panel card">
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Payment account status</div>
                  <p className="lead">Stripe account summary.</p>
                </div>
              </div>
              <div className="backoffice-data-list" style={{ marginTop: "1rem" }}>
                <div className="backoffice-data-row"><span>Account created</span><strong>{provider.stripeConnectedAccount?.stripeAccountId ? "Yes" : "No"}</strong></div>
                <div className="backoffice-data-row"><span>Details submitted</span><strong>{provider.stripeConnectedAccount?.detailsSubmitted ? "Yes" : "No"}</strong></div>
                <div className="backoffice-data-row"><span>Charges enabled</span><strong>{provider.stripeConnectedAccount?.chargesEnabled ? "Yes" : "No"}</strong></div>
                <div className="backoffice-data-row"><span>Payouts enabled</span><strong>{provider.stripeConnectedAccount?.payoutsEnabled ? "Yes" : "No"}</strong></div>
              </div>
            </section>

            <section className="panel card">
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Access gates</div>
                  <p className="lead">What unlocks next.</p>
                </div>
              </div>
              <div className="backoffice-data-list">
                <div className="backoffice-data-row"><span>Onboarding area</span><strong>Always available after login</strong></div>
                <div className="backoffice-data-row"><span>Stripe setup</span><strong>{stripeUnlocked ? "Available" : "Waiting for approval"}</strong></div>
                <div className="backoffice-data-row"><span>Pricing portal</span><strong>{pricingUnlocked ? "Available" : "Waiting for Stripe readiness"}</strong></div>
                <div className="backoffice-data-row"><span>Full provider dashboard</span><strong>{fullDashboard ? "Available" : "Active providers only"}</strong></div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
