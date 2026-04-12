import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listProviderCompanies } from "@/lib/providers/repository";
import { createProviderInviteAction, toggleProviderStatusAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { providerServiceCatalog } from "@/lib/providers/service-catalog-mapping";
import { getProviderOnboardingMetadata } from "@/lib/providers/onboarding-profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteForm } from "./invite-form";
import { Input } from "@/components/ui/input";
import { getAdminTranslations } from "@/lib/i18n/server";

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
  const t = await getAdminTranslations();

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
              <CardTitle className="mt-1 text-xl">{t.providers.title}</CardTitle>
              <CardDescription>{t.providers.description}</CardDescription>
            </div>
            <Badge variant="secondary">{filteredRows.length} shown</Badge>
          </div>
        </CardHeader>
        {(error || status || inviteLink) && (
          <CardContent>
            {error && <p className="text-sm leading-relaxed text-destructive">{t.providers.actionBlocked} {error}</p>}
            {status && <p className={`text-sm leading-relaxed text-green-600${error ? " mt-1" : ""}`}>{status.replace(/_/g, " ")}.</p>}
            {inviteLink && (
              <Card className="mt-3 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardContent className="space-y-1">
                  <strong className="text-sm">{t.providers.inviteReady} {inviteEmail || t.providers.provider}</strong>
                  <span className="block text-sm text-muted-foreground">
                    {delivery === "email" ? t.providers.inviteEmailSent : t.providers.useLinkManually}
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
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.totalProviders}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.soleTraders}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.soleTrader}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.companyProviders}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.company}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.activeLive}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.active}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.providers.filters}</p>
          <CardDescription>{t.providers.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
            <Input name="q" defaultValue={normaliseQueryValue(params.q)} placeholder={t.providers.searchPlaceholder} />
            <select
              name="type"
              defaultValue={businessTypeFilter}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">{t.providers.showAll}</option>
              <option value="sole_trader">{t.providers.soleTrader}</option>
              <option value="company">{t.providers.companyProvider}</option>
            </select>
            <div className="flex gap-2">
              <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
                {t.providers.applyFilters}
              </button>
              <Link href="/admin/providers" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                {t.providers.showAll}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.providers.inviteProvider}</p>
          <CardDescription>{t.providers.inviteDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm categories={providerServiceCatalog} action={createProviderInviteAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.providers.providersTable}</CardTitle>
          <CardDescription>{t.providers.providersTableDesc}</CardDescription>
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
                    {t.providerStatusLabels[row.provider.status] ?? row.provider.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.businessType}</div>
                    <div className="mt-1 font-medium">{row.businessType === "sole_trader" ? t.providers.soleTrader : t.providers.company}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.stripe}</div>
                    <div className={`mt-1 font-medium ${row.stripeReady ? "text-green-600" : "text-destructive"}`}>{row.stripeReady ? t.providers.ready : t.providers.notReady}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.coverage}</div>
                    <div className="mt-1 font-medium">{row.coverageCount} {t.providers.prefixes}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.providers.checklist}</div>
                    <div className="mt-1 font-medium">{row.completedCount}/{row.checklist.items.length}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/provider/${row.provider.id}`} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
                    {t.providers.openReview}
                  </Link>
                  <form action={toggleProviderStatusAction}>
                    <input type="hidden" name="providerCompanyId" value={row.provider.id} />
                    <input type="hidden" name="nextStatus" value={row.provider.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
                    <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground" type="submit">
                      {row.provider.status === "SUSPENDED" ? t.providers.activate : t.providers.suspend}
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
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.provider}</th>
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.businessType}</th>
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.status}</th>
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.coverage}</th>
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.pricing}</th>
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.stripe}</th>
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.checklist}</th>
                  <th className="px-3 py-3 font-medium">{t.providers.tableHeaders.actions}</th>
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
                        <div className="text-xs text-muted-foreground">{row.provider.companyNumber || t.providers.noCompanyNumber}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Badge variant="outline">{row.businessType === "sole_trader" ? t.providers.soleTrader : t.providers.company}</Badge>
                    </td>
                    <td className="px-3 py-4">
                      <Badge variant={statusBadgeVariant[row.provider.status] ?? "secondary"}>
                        {t.providerStatusLabels[row.provider.status] ?? row.provider.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">
                      <div>{row.coverageCount} {t.providers.postcondePrefixes}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[...new Set(row.provider.coverageAreas.map((item) => item.postcodePrefix))].slice(0, 4).map((prefix) => (
                          <Badge key={prefix} variant="outline" className="text-[10px] font-mono">{prefix}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{row.activePricingCount} {t.providers.activeRules}</td>
                    <td className="px-3 py-4">
                      <span className={row.stripeReady ? "font-medium text-green-600" : "font-medium text-destructive"}>
                        {row.stripeReady ? t.providers.ready : t.providers.notReady}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{row.completedCount}/{row.checklist.items.length}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/provider/${row.provider.id}`} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
                          {t.providers.openReview}
                        </Link>
                        <form action={toggleProviderStatusAction}>
                          <input type="hidden" name="providerCompanyId" value={row.provider.id} />
                          <input type="hidden" name="nextStatus" value={row.provider.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
                          <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground" type="submit">
                            {row.provider.status === "SUSPENDED" ? t.providers.activate : t.providers.suspend}
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
              {t.providers.noProvidersMatch}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
