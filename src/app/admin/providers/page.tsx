import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listProviderCompanies } from "@/lib/providers/repository";
import { createProviderInviteAction, toggleProviderStatusAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { providerServiceCatalog, providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { getProviderOnboardingMetadata } from "@/lib/providers/onboarding-profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteForm } from "./invite-form";
import { Input } from "@/components/ui/input";

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

function normaliseQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function AdminProvidersPage({ searchParams }: AdminProvidersPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const status = typeof params.status === "string" ? params.status : "";
  const inviteEmail = typeof params.inviteEmail === "string" ? decodeURIComponent(params.inviteEmail) : "";
  const inviteLink = typeof params.inviteLink === "string" ? decodeURIComponent(params.inviteLink) : "";
  const delivery = typeof params.delivery === "string" ? params.delivery : "";
  const query = normaliseQueryValue(params.q).toLowerCase();
  const businessTypeFilter = normaliseQueryValue(params.type) || "all";

  const providers = await listProviderCompanies();
  const providerRows = providers.map((provider) => {
    const checklist = buildProviderChecklist(provider);
    const completedCount = checklist.items.filter((item) => item.complete).length;
    const stripeReady = Boolean(
      provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled,
    );
    const metadata = getProviderOnboardingMetadata(provider.stripeRequirementsJson);
    const businessType = metadata.businessType;
    const searchable = [
      provider.tradingName,
      provider.legalName,
      provider.contactEmail,
      provider.phone,
      provider.companyNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      provider,
      checklist,
      completedCount,
      stripeReady,
      businessType,
      searchable,
      coverageCount: new Set(provider.coverageAreas.map((item) => item.postcodePrefix)).size,
      activePricingCount: provider.pricingRules.filter((item) => item.active).length,
    };
  });

  const filteredRows = providerRows.filter((row) => {
    if (businessTypeFilter !== "all" && row.businessType !== businessTypeFilter) {
      return false;
    }

    if (query && !row.searchable.includes(query)) {
      return false;
    }

    return true;
  });

  const counts = {
    total: providerRows.length,
    soleTrader: providerRows.filter((row) => row.businessType === "sole_trader").length,
    company: providerRows.filter((row) => row.businessType === "company").length,
    active: providerRows.filter((row) => row.provider.status === "ACTIVE").length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
              <CardTitle className="mt-1 text-xl">Provider dashboard</CardTitle>
              <CardDescription>Track sole traders and company providers clearly in one place.</CardDescription>
            </div>
            <Badge variant="secondary">{filteredRows.length} shown</Badge>
          </div>
        </CardHeader>
        {(error || status || inviteLink) && (
          <CardContent>
            {error && <p className="text-sm leading-relaxed text-destructive">Action blocked: {error}</p>}
            {status && <p className={`text-sm leading-relaxed text-green-600${error ? " mt-1" : ""}`}>{status.replace(/_/g, " ")}.</p>}
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total providers</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Sole traders</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.soleTrader}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Company providers</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.company}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active live</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.active}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</p>
          <CardDescription>Search by provider name, email, phone, or company number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
            <Input name="q" defaultValue={normaliseQueryValue(params.q)} placeholder="Search provider, email, phone, company number" />
            <select
              name="type"
              defaultValue={businessTypeFilter}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">Show all</option>
              <option value="sole_trader">Sole trader</option>
              <option value="company">Company provider</option>
            </select>
            <div className="flex gap-2">
              <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
                Apply filters
              </button>
              <Link href="/admin/providers" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                Show all
              </Link>
            </div>
          </form>
        </CardContent>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Providers</CardTitle>
          <CardDescription>A clear list of every provider account, with business type, readiness, and quick actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {filteredRows.map((row) => (
              <div key={row.provider.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{row.provider.tradingName || row.provider.legalName || row.provider.contactEmail}</div>
                    <div className="text-sm text-muted-foreground">{row.provider.contactEmail}</div>
                    {row.provider.phone && <div className="text-sm text-muted-foreground">{row.provider.phone}</div>}
                  </div>
                  <Badge variant={statusBadgeVariant[row.provider.status] ?? "secondary"}>
                    {providerStatusLabels[row.provider.status] ?? row.provider.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Business type</div>
                    <div className="mt-1 font-medium">{row.businessType === "sole_trader" ? "Sole trader" : "Company"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Stripe</div>
                    <div className={`mt-1 font-medium ${row.stripeReady ? "text-green-600" : "text-destructive"}`}>{row.stripeReady ? "Ready" : "Not ready"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Coverage</div>
                    <div className="mt-1 font-medium">{row.coverageCount} prefixes</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Checklist</div>
                    <div className="mt-1 font-medium">{row.completedCount}/{row.checklist.items.length}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/provider/${row.provider.id}`} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
                    Open review
                  </Link>
                  <form action={toggleProviderStatusAction}>
                    <input type="hidden" name="providerCompanyId" value={row.provider.id} />
                    <input type="hidden" name="nextStatus" value={row.provider.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
                    <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground" type="submit">
                      {row.provider.status === "SUSPENDED" ? "Activate" : "Suspend"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Provider</th>
                  <th className="px-3 py-3 font-medium">Business type</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Coverage</th>
                  <th className="px-3 py-3 font-medium">Pricing</th>
                  <th className="px-3 py-3 font-medium">Stripe</th>
                  <th className="px-3 py-3 font-medium">Checklist</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.provider.id} className="border-b align-top">
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{row.provider.tradingName || row.provider.legalName || row.provider.contactEmail}</div>
                        <div className="text-muted-foreground">{row.provider.contactEmail}</div>
                        {row.provider.phone && <div className="text-muted-foreground">{row.provider.phone}</div>}
                        <div className="text-xs text-muted-foreground">{row.provider.companyNumber || "No company number"}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Badge variant="outline">{row.businessType === "sole_trader" ? "Sole trader" : "Company"}</Badge>
                    </td>
                    <td className="px-3 py-4">
                      <Badge variant={statusBadgeVariant[row.provider.status] ?? "secondary"}>
                        {providerStatusLabels[row.provider.status] ?? row.provider.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">
                      <div>{row.coverageCount} postcode prefixes</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[...new Set(row.provider.coverageAreas.map((item) => item.postcodePrefix))].slice(0, 4).map((prefix) => (
                          <Badge key={prefix} variant="outline" className="text-[10px] font-mono">{prefix}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{row.activePricingCount} active rules</td>
                    <td className="px-3 py-4">
                      <span className={row.stripeReady ? "font-medium text-green-600" : "font-medium text-destructive"}>
                        {row.stripeReady ? "Ready" : "Not ready"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{row.completedCount}/{row.checklist.items.length}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/provider/${row.provider.id}`} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
                          Open review
                        </Link>
                        <form action={toggleProviderStatusAction}>
                          <input type="hidden" name="providerCompanyId" value={row.provider.id} />
                          <input type="hidden" name="nextStatus" value={row.provider.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
                          <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground" type="submit">
                            {row.provider.status === "SUSPENDED" ? "Activate" : "Suspend"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length === 0 && (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              No providers match this filter.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
