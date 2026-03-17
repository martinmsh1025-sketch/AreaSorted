import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProviderCompanyById } from "@/lib/providers/repository";
import { providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { reviewProviderDocumentAction, reviewProviderStatusAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { ProviderDocumentBadge, ProviderStatusBadge } from "@/components/providers/status-badge";

type AdminProviderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProviderDetailPage({ params, searchParams }: AdminProviderDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { id } = await params;
  const provider = await getProviderCompanyById(id);
  if (!provider) redirect("/admin/providers");

  const query = (await searchParams) ?? {};
  const status = typeof query.status === "string" ? query.status : "";
  const checklist = buildProviderChecklist(provider);

  return (
    <main className="section">
      <div className="container">
        <section className="panel card" style={{ marginBottom: "1rem" }}>
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Admin review</div>
              <h1 className="title" style={{ marginTop: "0.35rem" }}>{provider.tradingName || provider.legalName || provider.contactEmail}</h1>
              <p className="lead">Review, approve, or request changes.</p>
            </div>
            <div className="button-row" style={{ marginTop: 0 }}>
              <ProviderStatusBadge status={provider.status} />
              <span className="provider-soft-pill">Checklist {checklist.items.filter((item) => item.complete).length}/{checklist.items.length}</span>
            </div>
          </div>
          {status ? <p style={{ color: "var(--color-success)", lineHeight: 1.6, margin: 0 }}>{status.replace(/_/g, " ")}.</p> : null}
        </section>

        <section className="backoffice-metric-grid" style={{ marginBottom: "1rem" }}>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Provider state</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{providerStatusLabels[provider.status] || provider.status}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Provider status</p>
          </div>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Review submitted</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{provider.onboardingSubmittedAt ? new Date(provider.onboardingSubmittedAt).toLocaleDateString() : "Not yet"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Submission date</p>
          </div>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Stripe</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "Ready" : "Locked / pending"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Charges and payouts</p>
          </div>
        </section>

        <section className="backoffice-grid-2">
          <div className="backoffice-stack">
        <section className="panel card">
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Checklist</div>
              <p className="lead">Approval blockers.</p>
            </div>
          </div>
          <div className="backoffice-checklist-grid" style={{ marginTop: "1rem" }}>
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

        <section className="panel card">
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Provider details</div>
              <p className="lead">Company details.</p>
            </div>
          </div>
          <div className="backoffice-data-list" style={{ marginTop: "1rem" }}>
            <div className="backoffice-data-row"><span>Legal name</span><strong>{provider.legalName || "-"}</strong></div>
            <div className="backoffice-data-row"><span>Trading name</span><strong>{provider.tradingName || "-"}</strong></div>
            <div className="backoffice-data-row"><span>Company number</span><strong>{provider.companyNumber || "-"}</strong></div>
            <div className="backoffice-data-row"><span>Registered address</span><strong>{provider.registeredAddress || "-"}</strong></div>
            <div className="backoffice-data-row"><span>Contact email</span><strong>{provider.contactEmail}</strong></div>
            <div className="backoffice-data-row"><span>Phone</span><strong>{provider.phone || "-"}</strong></div>
            <div className="backoffice-data-row"><span>Coverage</span><strong>{provider.coverageAreas.map((item) => item.postcodePrefix).join(", ") || "-"}</strong></div>
            <div className="backoffice-data-row"><span>Categories</span><strong>{provider.serviceCategories.map((item) => item.categoryKey).join(", ") || "-"}</strong></div>
          </div>
        </section>
          </div>

          <div className="backoffice-stack">

        <section className="panel card">
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Document review</div>
              <p className="lead">Review required files.</p>
            </div>
          </div>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {provider.documents.length ? provider.documents.map((document) => (
              <section key={document.id} className="backoffice-document-card">
                <div className="backoffice-document-meta">
                  <div>
                    <strong>{document.label}</strong>
                    <div style={{ color: "var(--color-text-muted)", marginTop: "0.35rem" }}><a className="backoffice-link-inline" href={document.storagePath}>{document.fileName}</a></div>
                  </div>
                  <ProviderDocumentBadge status={document.status} />
                </div>
                <form action={reviewProviderDocumentAction} className="admin-filter-grid" style={{ marginTop: "1rem" }}>
                  <input type="hidden" name="providerCompanyId" value={provider.id} />
                  <input type="hidden" name="documentId" value={document.id} />
                  <label className="quote-field-stack admin-filter-span-4">
                    <span>Document status</span>
                    <select name="documentStatus" defaultValue={document.status}>
                      <option value="PENDING">pending</option>
                      <option value="APPROVED">approved</option>
                      <option value="REJECTED">rejected</option>
                      <option value="NEEDS_RESUBMISSION">needs resubmission</option>
                    </select>
                  </label>
                  <label className="quote-field-stack admin-filter-span-8">
                    <span>Document notes</span>
                    <input name="reviewNotes" defaultValue={document.reviewNotes || ""} />
                  </label>
                  <div className="admin-filter-actions" style={{ marginTop: 0 }}>
                    <FormSubmitButton label="Save document review" pendingLabel="Saving review" />
                  </div>
                </form>
              </section>
            )) : <div className="backoffice-empty"><strong>No documents uploaded yet</strong><span className="lead" style={{ margin: 0 }}>The provider has not submitted any files for review.</span></div>}
          </div>
        </section>

        <section className="panel card">
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Provider decision</div>
              <p className="lead">Set review outcome.</p>
            </div>
          </div>
          <form action={reviewProviderStatusAction} className="admin-filter-grid" style={{ marginTop: "1rem" }}>
            <input type="hidden" name="providerCompanyId" value={provider.id} />
            <label className="quote-field-stack admin-filter-span-4">
              <span>Decision</span>
              <select name="reviewStatus" defaultValue={provider.status === "SUBMITTED_FOR_REVIEW" ? "UNDER_REVIEW" : provider.status}>
                <option value="UNDER_REVIEW">under review</option>
                <option value="CHANGES_REQUESTED">request changes</option>
                <option value="REJECTED">reject</option>
                <option value="APPROVED">approve</option>
              </select>
            </label>
            <label className="quote-field-stack admin-filter-span-8">
              <span>Review notes</span>
              <textarea name="reviewNotes" rows={4} defaultValue={provider.reviewNotes || ""} />
            </label>
            <div className="admin-filter-actions" style={{ marginTop: 0 }}>
              <FormSubmitButton label="Save review decision" pendingLabel="Saving decision" />
            </div>
          </form>
        </section>
          </div>
        </section>
      </div>
    </main>
  );
}
