import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listProviderCompanies } from "@/lib/providers/repository";
import { createProviderInviteAction, toggleProviderStatusAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { providerStatusLabels } from "@/lib/providers/service-catalog-mapping";

type AdminProvidersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProvidersPage({ searchParams }: AdminProvidersPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const status = typeof params.status === "string" ? params.status : "";
  const providers = await listProviderCompanies();

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 900, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>Provider companies</h1>
          <p className="lead">Invite provider companies, review onboarding state, and monitor Stripe readiness.</p>
          {error ? <p style={{ color: "var(--color-error)", marginTop: "1rem", lineHeight: 1.6 }}>Activation blocked. Missing: {error}</p> : null}
          {status === "activated" ? <p style={{ color: "var(--color-success)", marginTop: "1rem", lineHeight: 1.6 }}>Provider activated successfully.</p> : null}
          {status === "suspended" ? <p style={{ color: "var(--color-success)", marginTop: "1rem", lineHeight: 1.6 }}>Provider suspended successfully.</p> : null}
        </div>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Invite provider</div>
          <form action={createProviderInviteAction} className="admin-filter-grid" style={{ marginTop: "1rem" }}>
            <label className="quote-field-stack admin-filter-span-6">
              <span>Provider email</span>
              <input type="email" name="email" placeholder="provider@example.com" />
            </label>
            <div className="admin-filter-actions" style={{ marginTop: 0 }}>
              <button type="submit" className="button button-primary">Send invite</button>
            </div>
          </form>
        </section>

        <div className="admin-table-shell" style={{ display: "grid", gap: "1rem" }}>
          {providers.map((provider) => (
            <section key={provider.id} className="panel card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div className="eyebrow">{provider.companyNumber}</div>
                  <strong style={{ fontSize: "1.2rem" }}>{provider.tradingName || provider.legalName}</strong>
                  <div style={{ color: "var(--color-text-muted)", marginTop: "0.35rem" }}>{provider.contactEmail}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="admin-status-pill">{providerStatusLabels[provider.status] || provider.status}</div>
                  <div style={{ color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                    Stripe: {provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "ready" : "pending"}
                  </div>
                </div>
              </div>

              <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
                {buildProviderChecklist(provider).items.map((item) => (
                  <div key={item.key}><span>{item.label}</span><strong>{item.complete ? "Done" : "Missing"}</strong></div>
                ))}
              </div>

              <div className="button-row" style={{ marginTop: "1rem" }}>
                <form action={toggleProviderStatusAction}>
                  <input type="hidden" name="providerCompanyId" value={provider.id} />
                  <input type="hidden" name="nextStatus" value={provider.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
                  <button className="button button-secondary" type="submit">{provider.status === "SUSPENDED" ? "Activate" : "Suspend"}</button>
                </form>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
