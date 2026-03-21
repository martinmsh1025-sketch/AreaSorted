import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listProviderCompanies } from "@/lib/providers/repository";
import { createProviderInviteAction, toggleProviderStatusAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { providerServiceCatalog, providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteForm } from "./invite-form";

type AdminProvidersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusBadgeVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  ACTIVE: "default",
  APPROVED: "default",
  SUSPENDED: "destructive",
  REJECTED: "destructive",
  INVITED: "outline",
  EMAIL_VERIFICATION_PENDING: "secondary",
  PASSWORD_SETUP_PENDING: "secondary",
  ONBOARDING_IN_PROGRESS: "secondary",
  SUBMITTED_FOR_REVIEW: "secondary",
  UNDER_REVIEW: "secondary",
  CHANGES_REQUESTED: "secondary",
  STRIPE_PENDING: "secondary",
  STRIPE_RESTRICTED: "secondary",
  PRICING_PENDING: "secondary",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
              <CardTitle className="mt-1 text-xl">Provider companies</CardTitle>
              <CardDescription>Manage provider setup and approval.</CardDescription>
            </div>
            <Badge variant="secondary">{providers.length} providers</Badge>
          </div>
        </CardHeader>
        {(error || status || inviteLink) && (
          <CardContent>
            {error && (
              <p className="text-sm leading-relaxed text-destructive">Action blocked: {error}</p>
            )}
            {status && (
              <p className={`text-sm leading-relaxed text-green-600${error ? " mt-1" : ""}`}>
                {status.replace(/_/g, " ")}.
              </p>
            )}
            {inviteLink && (
              <Card className="mt-3 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardContent className="space-y-1">
                  <strong className="text-sm">Invite ready for {inviteEmail || "provider"}</strong>
                  <span className="block text-sm text-muted-foreground">
                    {delivery === "email" ? "Invite email sent." : "Use this link to send manually."}
                  </span>
                  <code className="block break-all text-xs">{inviteLink}</code>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invite provider</p>
          <CardDescription>Send an invite to start setup.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm categories={providerServiceCatalog} action={createProviderInviteAction} />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {providers.map((provider) => {
          const checklist = buildProviderChecklist(provider);
          const completedCount = checklist.items.filter((item) => item.complete).length;
          const stripeReady =
            provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled;

          return (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {provider.companyNumber || "No company number yet"}
                    </p>
                    <strong className="text-lg">
                      {provider.tradingName || provider.legalName || provider.contactEmail}
                    </strong>
                    <p className="mt-1 text-sm text-muted-foreground">{provider.contactEmail}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusBadgeVariant[provider.status] ?? "secondary"}>
                      {providerStatusLabels[provider.status] ?? provider.status}
                    </Badge>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Submitted:{" "}
                      {provider.onboardingSubmittedAt
                        ? new Date(provider.onboardingSubmittedAt).toLocaleDateString()
                        : "not yet"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <span className="block text-xs text-muted-foreground">Checklist complete</span>
                    <strong className="text-sm">
                      {completedCount}/{checklist.items.length}
                    </strong>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <span className="block text-xs text-muted-foreground">Documents</span>
                    <strong className="text-sm">{provider.documents.length}</strong>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <span className="block text-xs text-muted-foreground">Pricing</span>
                    <strong className="text-sm">
                      {provider.pricingRules.filter((item) => item.active).length} active
                    </strong>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <span className="block text-xs text-muted-foreground">Stripe Status</span>
                    <strong className={`text-sm ${stripeReady ? "text-green-600" : "text-destructive"}`}>
                      {stripeReady ? "Ready" : "Not ready"}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/provider/${provider.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
                  >
                    Open review
                  </Link>
                  <form action={toggleProviderStatusAction}>
                    <input type="hidden" name="providerCompanyId" value={provider.id} />
                    <input
                      type="hidden"
                      name="nextStatus"
                      value={provider.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"}
                    />
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                      type="submit"
                    >
                      {provider.status === "SUSPENDED" ? "Activate" : "Suspend"}
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
