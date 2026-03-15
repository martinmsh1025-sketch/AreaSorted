import { redirect } from "next/navigation";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import { getProviderCompanyById } from "@/lib/providers/repository";
import { startStripeOnboardingAction, syncStripeStatusAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";

export default async function ProviderDashboardPage() {
  const providerCompanyId = await getProviderSessionCompanyId();
  if (!providerCompanyId) redirect("/provider/login");

  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) redirect("/provider/login");
  const checklist = buildProviderChecklist(provider);

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 900, marginBottom: "2rem" }}>
          <div className="eyebrow">Provider portal</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>{provider.tradingName || provider.legalName}</h1>
          <p className="lead">Review onboarding progress, Stripe readiness, service coverage, and portal setup status.</p>
        </div>

        <section className="section-card-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Onboarding</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.4rem" }}>{provider.status}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Current provider company status</p>
          </div>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Stripe charges</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.4rem" }}>{provider.stripeConnectedAccount?.chargesEnabled ? "Enabled" : "Pending"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Can accept direct charges</p>
          </div>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Stripe payouts</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.4rem" }}>{provider.stripeConnectedAccount?.payoutsEnabled ? "Enabled" : "Pending"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Can receive payouts</p>
          </div>
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Stripe Connect</div>
          <p className="lead">Complete Stripe onboarding before the platform marks this provider as payment-ready.</p>
          <div className="button-row">
            <form action={startStripeOnboardingAction}>
              <button className="button button-primary" type="submit">Start Stripe onboarding</button>
            </form>
            <form action={syncStripeStatusAction}>
              <button className="button button-secondary" type="submit">Sync Stripe status</button>
            </form>
          </div>
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Readiness summary</div>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            {checklist.items.map((item) => (
              <div key={item.key}><span>{item.label}</span><strong>{item.complete ? "Done" : "Missing"}</strong></div>
            ))}
          </div>
        </section>

        <section className="panel card">
          <div className="eyebrow">Company details</div>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            <div><span>Legal name</span><strong>{provider.legalName}</strong></div>
            <div><span>Company number</span><strong>{provider.companyNumber}</strong></div>
            <div><span>Registered address</span><strong>{provider.registeredAddress}</strong></div>
            <div><span>Contact</span><strong>{provider.contactEmail}</strong></div>
          </div>
        </section>
      </div>
    </main>
  );
}
