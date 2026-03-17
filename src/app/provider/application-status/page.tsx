import Link from "next/link";
import { requireProviderSession } from "@/lib/provider-auth";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { providerPortalStatusLabels, providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { canProviderAccessDashboard, canProviderAccessPricing, canProviderAccessStripe, canProviderEditOnboarding } from "@/lib/providers/status";
import { providerLogoutAction } from "@/app/provider/login/actions";

type ProviderApplicationStatusPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderApplicationStatusPage({ searchParams }: ProviderApplicationStatusPageProps) {
  const session = await requireProviderSession();
  const provider = session.providerCompany;
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : "";
  const canOpenDashboard = canProviderAccessDashboard(provider.status);
  const canResumeOnboarding = canProviderEditOnboarding(provider.status);
  const canOpenStripe = canProviderAccessStripe(provider.status);
  const canOpenPricing = canProviderAccessPricing(provider.status);
  const nextCta = canResumeOnboarding
    ? { href: "/provider/onboarding", label: "Edit application" }
    : canOpenPricing
      ? { href: "/provider/pricing", label: "Set pricing" }
      : canOpenStripe
        ? { href: "/provider/dashboard", label: "Open payment account" }
        : canOpenDashboard
          ? { href: "/provider/orders", label: "Open orders" }
          : { href: "/provider", label: "Open dashboard" };

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 840 }}>
        <section className="panel card" style={{ padding: "2rem" }}>
          <div className="eyebrow">Provider application</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>
            {status === "submitted" ? "Application sent" : "Application status"}
          </h1>
          <p className="lead" style={{ maxWidth: 620 }}>
            Track review progress here.
          </p>
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <ProviderStatusBadge status={provider.status} />
            <span className="provider-soft-pill is-active">{providerPortalStatusLabels[provider.status] || provider.status}</span>
          </div>
          <div className="provider-status-panel" style={{ marginTop: "1.25rem" }}>
            <strong>Current status</strong>
            <p className="lead" style={{ margin: 0 }}>
              Status: {providerStatusLabels[provider.status] || provider.status}.
            </p>
            <p className="lead" style={{ margin: 0 }}>
              {provider.status === "SUBMITTED_FOR_REVIEW" || provider.status === "UNDER_REVIEW"
                ? "Your application is now under review. We will update the status here as soon as there is progress."
                : provider.status === "CHANGES_REQUESTED"
                  ? "Changes are required before approval. Re-open onboarding to update your details."
                  : provider.status === "APPROVED" || provider.status === "STRIPE_PENDING" || provider.status === "STRIPE_RESTRICTED" || provider.status === "PRICING_PENDING"
                    ? "Your application has progressed. Complete payment account and pricing steps to unlock the live provider portal."
                    : "You can monitor the latest onboarding outcome from this page."}
            </p>
          </div>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link href="/provider" className="button button-secondary">Provider home</Link>
            <Link href={nextCta.href} className="button button-primary">{nextCta.label}</Link>
            <form action={providerLogoutAction}>
              <button type="submit" className="button button-secondary">Log out</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
