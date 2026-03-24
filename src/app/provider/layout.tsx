import { providerLogoutAction } from "@/app/provider/login/actions";
import { getProviderSession } from "@/lib/provider-auth";
import {
  canProviderAccessAccount,
  canProviderAccessOrders,
  canProviderAccessPricing,
  canProviderAccessStripe,
  canProviderViewOrders,
  canProviderEditOnboarding,
} from "@/lib/providers/status";
import { providerPortalStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { ProviderShell } from "@/components/provider/provider-shell";
import type { NavGroup } from "@/components/provider/provider-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

function buildProviderNav(status: string): NavGroup[] {
  const groups: NavGroup[] = [];

  /* ── Main ─────────────────────────────────── */
  const mainItems: NavGroup["items"] = [
    { href: "/provider", label: "Home", icon: "Home" },
  ];

  if (canProviderViewOrders(status)) {
    mainItems.push({ href: "/provider/orders", label: "My Orders", icon: "Orders" });
  }

  if (canProviderAccessAccount(status)) {
    mainItems.push({ href: "/provider/notifications", label: "Notifications", icon: "Notifications" });
  }

  if (canProviderAccessOrders(status)) {
    mainItems.push({ href: "/provider/invoices", label: "Invoices", icon: "Invoices" });
  }

  groups.push({ label: null, items: mainItems });

  /* ── Onboarding (pre-approval only) ─────── */
  const onboardingItems: NavGroup["items"] = [];

  if (canProviderEditOnboarding(status)) {
    onboardingItems.push({ href: "/provider/onboarding", label: "Onboarding", icon: "Onboarding" });
  }

  // Show Application Status for non-active providers who are past onboarding
  const showApplicationStatus = [
    "SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "CHANGES_REQUESTED", "REJECTED",
    "APPROVED", "STRIPE_PENDING", "STRIPE_RESTRICTED", "PRICING_PENDING",
  ].includes(status);

  if (showApplicationStatus) {
    onboardingItems.push({ href: "/provider/application-status", label: "Application Status", icon: "Application" });
  }

  if (onboardingItems.length > 0) {
    groups.push({ label: "Getting Started", items: onboardingItems });
  }

  /* ── Business Setup ────────────────────────── */
  const setupItems: NavGroup["items"] = [];

  if (canProviderAccessStripe(status)) {
    setupItems.push({ href: "/provider/payment", label: "Payments", icon: "Payment" });
  }

  if (canProviderAccessPricing(status)) {
    setupItems.push({ href: "/provider/coverage", label: "Service Areas", icon: "Coverage" });
    setupItems.push({ href: "/provider/pricing", label: "Pricing", icon: "Pricing" });
    setupItems.push({ href: "/provider/availability", label: "Availability", icon: "Availability" });
  }

  if (setupItems.length > 0) {
    groups.push({ label: "Business", items: setupItems });
  }

  /* ── Account ───────────────────────────────── */
  if (canProviderAccessAccount(status)) {
    groups.push({
      label: "Account",
      items: [
        { href: "/provider/account", label: "My Profile", icon: "Account" },
      ],
    });
  }

  return groups;
}

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getProviderSession();
  const provider = session?.providerCompany || null;
  const providerNav = provider ? buildProviderNav(provider.status) : [];
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
