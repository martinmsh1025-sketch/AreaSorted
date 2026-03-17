import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProviderOnboardingAccess } from "@/lib/provider-auth";
import { canProviderEditOnboarding } from "@/lib/providers/status";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { submitProviderForReviewAction } from "@/app/provider/onboarding/actions";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { getProviderCategoryByKey } from "@/lib/providers/service-catalog-mapping";

type ProviderApplicationConfirmationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderApplicationConfirmationPage({ searchParams }: ProviderApplicationConfirmationPageProps) {
  const session = await requireProviderOnboardingAccess();
  const provider = session.providerCompany;
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";

  if (!canProviderEditOnboarding(provider.status)) {
    redirect("/provider/application-status");
  }

  const checklist = buildProviderChecklist(provider);
  const summaryItems = checklist.items.filter((item) => ["profile", "categories", "coverage", "documents_uploaded", "agreement"].includes(item.key));
  const missingBeforeSubmit = checklist.items.filter((item) => ["email_verified", "password_set", "profile", "categories", "coverage", "documents_uploaded", "agreement"].includes(item.key) && !item.complete);
  const lockedCategory = getProviderCategoryByKey(session.latestInvite?.approvedCategoryKey || provider.serviceCategories[0]?.categoryKey || "");
  const selectedServiceKeys = provider.stripeRequirementsJson && typeof provider.stripeRequirementsJson === "object" && !Array.isArray(provider.stripeRequirementsJson) && Array.isArray(provider.stripeRequirementsJson.approvedServiceKeys)
    ? provider.stripeRequirementsJson.approvedServiceKeys.map((item) => String(item))
    : [];
  const selectedServices = lockedCategory?.services.filter((service) => selectedServiceKeys.includes(service.key)) || [];
  const coveragePostcodes = Array.from(new Set(provider.coverageAreas.map((item) => item.postcodePrefix))).sort();
  const uploadedDocuments = provider.documents.filter((document) => ["PENDING", "APPROVED"].includes(document.status));

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <section className="panel card" style={{ padding: "1rem" }}>
          <div className="compact-header">
            <div>
              <div className="eyebrow">Final confirmation</div>
              <h1 className="title">Confirm your application</h1>
            </div>
            <div className="button-row" style={{ marginTop: 0 }}>
              <ProviderStatusBadge status={provider.status} />
              <span className="provider-soft-pill is-active">Next: admin review</span>
            </div>
          </div>
          {error ? <div className="provider-status-panel" style={{ marginTop: "1rem", borderColor: "rgba(176, 57, 57, 0.18)", background: "rgba(255, 241, 241, 0.92)" }}><strong style={{ color: "var(--color-error)" }}>Cannot submit yet</strong><p style={{ color: "var(--color-error)", margin: 0, lineHeight: 1.6 }}>{error}</p></div> : null}
          {!error && missingBeforeSubmit.length ? <div className="provider-status-panel" style={{ marginTop: "1rem", borderColor: "rgba(176, 57, 57, 0.18)", background: "rgba(255, 241, 241, 0.92)" }}><strong style={{ color: "var(--color-error)" }}>Finish these before you submit</strong><p style={{ color: "var(--color-error)", margin: 0, lineHeight: 1.6 }}>{missingBeforeSubmit.map((item) => item.label).join(", ")}</p></div> : null}

          <div className="provider-status-panel" style={{ marginTop: "0.9rem" }}>
            {summaryItems.map((item) => (
              <div key={item.key} className="provider-mini-row">
                <span>{item.label}</span>
                <strong>{item.complete ? "Ready" : item.detail}</strong>
              </div>
            ))}
          </div>

          <div className="provider-shell-grid" style={{ marginTop: "0.9rem" }}>
            <div className="provider-side-card">
              <div className="provider-side-section">
                <strong>Company details</strong>
                <div className="provider-mini-row"><span>Legal name</span><strong>{provider.legalName || "Missing"}</strong></div>
                <div className="provider-mini-row"><span>Company number</span><strong>{provider.companyNumber || "Missing"}</strong></div>
                <div className="provider-mini-row"><span>Email</span><strong>{provider.contactEmail || session.user.email}</strong></div>
                <div className="provider-mini-row"><span>Phone</span><strong>{provider.phone || "Missing"}</strong></div>
                <div className="provider-mini-row"><span>Address</span><strong>{provider.registeredAddress || "Missing"}</strong></div>
                <div className="button-row"><Link href="/provider/onboarding?step=1" className="button button-secondary">Edit</Link></div>
              </div>
              <div className="provider-side-section">
                <strong>Service setup</strong>
                <div className="provider-mini-row"><span>Category</span><strong>{lockedCategory?.label || "Missing"}</strong></div>
                <div className="provider-mini-row"><span>Services</span><strong>{selectedServices.length}</strong></div>
                {selectedServices.length ? <p className="lead" style={{ margin: 0 }}>{selectedServices.map((service) => service.label).join(", ")}</p> : null}
                <div className="button-row"><Link href="/provider/onboarding?step=2" className="button button-secondary">Edit</Link></div>
              </div>
            </div>
            <div className="provider-side-card">
              <div className="provider-side-section">
                <strong>Coverage</strong>
                <div className="provider-mini-row"><span>Postcodes</span><strong>{coveragePostcodes.length}</strong></div>
                {coveragePostcodes.length ? <p className="lead" style={{ margin: 0 }}>{coveragePostcodes.join(", ")}</p> : <p className="lead" style={{ margin: 0 }}>No coverage selected yet.</p>}
                <div className="button-row"><Link href="/provider/onboarding?step=3" className="button button-secondary">Edit</Link></div>
              </div>
              <div className="provider-side-section">
                <strong>Documents</strong>
                {uploadedDocuments.length ? uploadedDocuments.map((document) => (
                  <div key={document.id || document.documentKey} className="provider-mini-row">
                    <span>{document.label || document.documentKey}</span>
                    <strong>{document.fileName}</strong>
                  </div>
                )) : <p className="lead" style={{ margin: 0 }}>No documents uploaded yet.</p>}
                <div className="button-row"><Link href="/provider/onboarding?step=4" className="button button-secondary">Edit</Link></div>
              </div>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: "1rem" }}>
            <Link href="/provider/onboarding?step=4" className="button button-secondary">Back</Link>
            <form action={submitProviderForReviewAction}>
              <FormSubmitButton label="Confirm and submit" pendingLabel="Submitting application" disabled={Boolean(missingBeforeSubmit.length)} />
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
