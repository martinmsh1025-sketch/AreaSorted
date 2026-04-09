import { providerLogoutAction } from "@/app/provider/login/actions";
import { getProviderSession } from "@/lib/provider-auth";
import { providerPortalStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { ProviderShell } from "@/components/provider/provider-shell";
import type { NavGroup } from "@/components/provider/provider-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

function buildProviderNav(): NavGroup[] {
  return [
    {
      label: null,
      items: [
        { href: "/provider", label: "Home", icon: "Home" },
        { href: "/provider/onboarding", label: "Onboarding", icon: "Onboarding" },
        { href: "/provider/account", label: "My Profile", icon: "Account" },
        { href: "/provider/preview", label: "Preview", icon: "Account" },
        { href: "/provider/notifications", label: "Notifications", icon: "Notifications" },
      ],
    },
  ];
}

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getProviderSession();
  const provider = session?.providerCompany || null;
  const providerNav = provider ? buildProviderNav() : [];
  const displayName = provider
    ? provider.tradingName || provider.legalName || provider.contactEmail
    : null;
  const statusLabel = provider
    ? providerPortalStatusLabels[provider.status] || provider.status
    : null;

  return (
    <TooltipProvider>
      <ProviderShell
        providerName={displayName}
        providerStatus={provider?.status || null}
        statusLabel={statusLabel}
        navGroups={providerNav}
        logoutAction={providerLogoutAction}
      >
        {children}
      </ProviderShell>
    </TooltipProvider>
  );
}
