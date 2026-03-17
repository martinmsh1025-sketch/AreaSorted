import { providerLogoutAction } from "@/app/provider/login/actions";
import { getProviderSession } from "@/lib/provider-auth";
import { canProviderAccessAccount, canProviderAccessDashboard, canProviderAccessOrders, canProviderAccessPricing, canProviderAccessStripe, canProviderEditOnboarding } from "@/lib/providers/status";
import { providerPortalStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { ProviderStatusBadge } from "@/components/providers/status-badge";

function buildProviderNav(status: string) {
  const nav = [{ href: "/provider", label: "Overview" }];

  if (canProviderEditOnboarding(status)) {
    nav.push({ href: "/provider/onboarding", label: "Onboarding" });
  }

  nav.push({ href: "/provider/application-status", label: "Application" });

  if (canProviderAccessStripe(status)) {
    nav.push({ href: "/provider/dashboard", label: "Payment account" });
  }

  if (canProviderAccessPricing(status)) {
    nav.push({ href: "/provider/pricing", label: "Pricing" });
  }

  if (canProviderAccessOrders(status)) {
    nav.push({ href: "/provider/orders", label: "Orders" });
  }

  if (canProviderAccessAccount(status)) {
    nav.push({ href: "/provider/account", label: "Account" });
  }

  return nav;
}

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getProviderSession();
  const provider = session?.providerCompany || null;
  const providerNav = provider ? buildProviderNav(provider.status) : [];
  const displayName = provider ? (provider.tradingName || provider.legalName || provider.contactEmail) : "Onboarding, approval, payment account and pricing";

  return (
    <div className="backoffice-shell backoffice-provider-shell">
      <header className="backoffice-topbar">
        <div className="container backoffice-topbar-inner">
          <div>
            <div className="backoffice-kicker">AreaSorted Provider Portal</div>
            <strong className="backoffice-brand-title">{displayName}</strong>
            {provider ? (
              <div className="button-row" style={{ marginTop: "0.6rem", alignItems: "center" }}>
                <ProviderStatusBadge status={provider.status} />
                <span className="provider-soft-pill is-active">{providerPortalStatusLabels[provider.status] || provider.status}</span>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {provider ? (
              <>
                <nav className="backoffice-nav">
                  {providerNav.map((item) => (
                    <a key={item.href} href={item.href} className="backoffice-nav-link">
                      {item.label}
                    </a>
                  ))}
                </nav>
                <form action={providerLogoutAction}>
                  <button type="submit" className="button button-secondary">Logout</button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <div className="backoffice-body">{children}</div>
    </div>
  );
}
