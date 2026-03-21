import Link from "next/link";
import { requireProviderSession } from "@/lib/provider-auth";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { providerPortalStatusLabels, providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { canProviderAccessDashboard, canProviderAccessPricing, canProviderAccessStripe, canProviderEditOnboarding } from "@/lib/providers/status";
import { providerLogoutAction } from "@/app/provider/login/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, ArrowRight, LogOut } from "lucide-react";

type ProviderApplicationStatusPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStatusIcon(status: string) {
  if (["APPROVED", "ACTIVE"].includes(status)) return CheckCircle;
  if (["CHANGES_REQUESTED", "REJECTED", "SUSPENDED"].includes(status)) return AlertCircle;
  return Clock;
}

function getStatusDescription(status: string) {
  if (status === "SUBMITTED_FOR_REVIEW" || status === "UNDER_REVIEW") {
    return "Your application is under review. We will update the status here as soon as there is progress.";
  }
  if (status === "CHANGES_REQUESTED") {
    return "Changes are required before your application can be approved. Re-open onboarding to update your details.";
  }
  if (["APPROVED", "STRIPE_PENDING", "STRIPE_RESTRICTED", "PRICING_PENDING"].includes(status)) {
    return "Your application has been approved. Complete the payment account and pricing setup to go live.";
  }
  return "You can monitor the latest status of your onboarding from this page.";
}

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
        ? { href: "/provider/payment", label: "Open payment account" }
        : canOpenDashboard
          ? { href: "/provider/orders", label: "Open orders" }
          : { href: "/provider", label: "Open dashboard" };

  const StatusIcon = getStatusIcon(provider.status);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {status === "submitted" ? "Application sent" : "Application status"}
        </h1>
        <p className="text-sm text-muted-foreground">Track your provider application progress.</p>
      </div>

      {/* ─── Status card ─── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className={`flex size-12 items-center justify-center rounded-full ${
              ["APPROVED", "ACTIVE"].includes(provider.status)
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : ["CHANGES_REQUESTED", "REJECTED", "SUSPENDED"].includes(provider.status)
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
            }`}>
              <StatusIcon className="size-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <ProviderStatusBadge status={provider.status} />
                <Badge variant="outline" className="text-xs">
                  {providerPortalStatusLabels[provider.status] || provider.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {getStatusDescription(provider.status)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Actions ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" render={<Link href="/provider" />}>
          Provider home
        </Button>
        <Button render={<Link href={nextCta.href} />} className="bg-blue-600 hover:bg-blue-700 text-white">
          {nextCta.label}
          <ArrowRight className="size-4" />
        </Button>
        <form action={providerLogoutAction}>
          <Button type="submit" variant="ghost">
            <LogOut className="size-4" />
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}
