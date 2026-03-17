import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listProviderCompanies } from "@/lib/providers/repository";
import { createProviderInviteAction, toggleProviderStatusAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { providerServiceCatalog, providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { InviteForm } from "./invite-form";

type AdminProvidersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProvidersPage({ searchParams }: AdminProvidersPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const status = typeof params.status === "string" ? params.status : "";
  const inviteEmail = typeof params.inviteEmail === "string" ? decodeURIComponent(params.inviteEmail) : "";
  const inviteLink = typeof params.inviteLink === "string" ? decodeURIComponent(params.inviteLink) : "";
  const delivery = typeof params.delivery === "string" ? params.delivery : "";
  const providers = await listProviderCompanies();

  return (
    <main className="section">
      <div className="container">
        <section className="panel card" style={{ marginBottom: "1rem" }}>
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Admin</div>
              <h1 className="title" style={{ marginTop: "0.35rem" }}>Provider companies</h1>
              <p className="lead">Manage provider setup and approval.</p>
            </div>
            <div className="provider-soft-pill is-active">{providers.length} providers</div>
          </div>
          {error ? <p style={{ color: "var(--color-error)", lineHeight: 1.6, margin: 0 }}>Action blocked: {error}</p> : null}
          {status ? <p style={{ color: "var(--color-success)", lineHeight: 1.6, margin: error ? "0.35rem 0 0" : 0 }}>{status.replace(/_/g, " ")}.</p> : null}
          {inviteLink ? <div className="backoffice-callout" style={{ marginTop: "0.8rem" }}><strong>Invite ready for {inviteEmail || "provider"}</strong><span>{delivery === "email" ? "Invite email sent." : "Use this link to send manually."}</span><code style={{ wordBreak: "break-all" }}>{inviteLink}</code></div> : null}
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Invite provider</div>
              <p className="lead">Send an invite to start setup.</p>
            </div>
          </div>
          <InviteForm categories={providerServiceCatalog} action={createProviderInviteAction} />
        </section>

        <div className="admin-table-shell" style={{ display: "grid", gap: "0.8rem" }}>
          {providers.map((provider) => {
            const checklist = buildProviderChecklist(provider);
            const completedCount = checklist.items.filter((item) => item.complete).length;
            return (
              <section key={provider.id} className="panel card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div className="eyebrow">{provider.companyNumber || "No company number yet"}</div>
                    <strong style={{ fontSize: "1.2rem" }}>{provider.tradingName || provider.legalName || provider.contactEmail}</strong>
                    <div style={{ color: "var(--color-text-muted)", marginTop: "0.35rem" }}>{provider.contactEmail}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <ProviderStatusBadge status={provider.status} />
                    <div style={{ color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                      Submitted: {provider.onboardingSubmittedAt ? new Date(provider.onboardingSubmittedAt).toLocaleDateString() : "not yet"}
                    </div>
                  </div>
                </div>

                <div className="backoffice-metric-grid" style={{ marginTop: "1rem" }}>
                  <div className="backoffice-kpi-card"><span>Checklist complete</span><strong>{completedCount}/{checklist.items.length}</strong></div>
                  <div className="backoffice-kpi-card"><span>Documents</span><strong>{provider.documents.length}</strong></div>
                  <div className="backoffice-kpi-card"><span>Pricing</span><strong>{provider.pricingRules.filter((item) => item.active).length} active</strong></div>
                  <div className="backoffice-kpi-card">
                    <span>Stripe Status</span>
                    <strong style={{ color: provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "var(--color-success)" : "var(--color-error)" }}>
                      {provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "Ready" : "Not ready"}
                    </strong>
                  </div>
                </div>

                <div className="button-row" style={{ marginTop: "1rem" }}>
                  <a href={`/admin/provider/${provider.id}`} className="button button-primary">Open review</a>
                  <form action={toggleProviderStatusAction}>
                    <input type="hidden" name="providerCompanyId" value={provider.id} />
                    <input type="hidden" name="nextStatus" value={provider.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
                    <button className="button button-secondary" type="submit">{provider.status === "SUSPENDED" ? "Activate" : "Suspend"}</button>
                  </form>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
