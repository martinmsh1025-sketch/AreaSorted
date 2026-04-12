import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createLeadAction,
  importLeadsCsvAction,
} from "./actions";
import {
  LEAD_SERVICE_CATEGORIES,
  LEAD_STATUSES,
  LEAD_SOURCES,
  statusBadgeVariant,
} from "./constants";
import { LeadDiscovery } from "./lead-discovery";
import { BatchDiscovery } from "./batch-discovery";
import { TrustpilotDiscovery } from "./trustpilot-discovery";
import { boroughPages } from "@/lib/seo/borough-pages";
import { getAdminTranslations } from "@/lib/i18n/server";
import type { LeadStatus, LeadSource, LeadServiceCategory, Prisma } from "@prisma/client";

type BoroughServiceRow = { borough: string; service: string; count: number };

const PAGE_SIZE = 50;

type LeadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normaliseQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function buildExportUrl(params: Record<string, string | string[] | undefined>) {
  const exportParams = new URLSearchParams();
  const keys = ["q", "leadStatus", "service", "source", "contact", "borough"];
  for (const key of keys) {
    const val = typeof params[key] === "string" ? params[key].trim() : "";
    if (val && val !== "all") {
      exportParams.set(key, val);
    }
  }
  const qs = exportParams.toString();
  return `/api/admin/leads/export${qs ? `?${qs}` : ""}`;
}

// Build Prisma where clause from query params — shared by count + findMany
function buildWhere(opts: {
  statusFilter: string;
  serviceFilter: string;
  sourceFilter: string;
  contactFilter: string;
  boroughFilter: string;
  query: string;
}): Prisma.ProviderLeadWhereInput {
  const conditions: Prisma.ProviderLeadWhereInput[] = [];

  if (opts.statusFilter !== "all") {
    conditions.push({ status: opts.statusFilter as LeadStatus });
  }
  if (opts.serviceFilter !== "all") {
    conditions.push({ services: { has: opts.serviceFilter as LeadServiceCategory } });
  }
  if (opts.sourceFilter !== "all") {
    conditions.push({ source: opts.sourceFilter as LeadSource });
  }
  if (opts.boroughFilter !== "all") {
    conditions.push({ boroughs: { has: opts.boroughFilter } });
  }

  // Contact filters
  const realEmailFilter: Prisma.LeadContactWhereInput = {
    channel: "EMAIL",
    NOT: [
      { value: { startsWith: "no-email-found@" } },
      { value: { startsWith: "scrape-failed@" } },
      { value: { contains: "@placeholder" } },
    ],
  };

  if (opts.contactFilter === "email") {
    conditions.push({ contacts: { some: realEmailFilter } });
  } else if (opts.contactFilter === "phone") {
    conditions.push({ contacts: { some: { channel: "PHONE" } } });
  } else if (opts.contactFilter === "whatsapp") {
    conditions.push({ contacts: { some: { channel: "WHATSAPP" } } });
  } else if (opts.contactFilter === "any") {
    conditions.push({ contacts: { some: {} } });
  } else if (opts.contactFilter === "none") {
    conditions.push({ contacts: { none: {} } });
  }

  // Text search
  if (opts.query) {
    conditions.push({
      OR: [
        { businessName: { contains: opts.query, mode: "insensitive" } },
        { website: { contains: opts.query, mode: "insensitive" } },
        { notes: { contains: opts.query, mode: "insensitive" } },
        { boroughs: { has: opts.query } },
      ],
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export default async function AdminLeadsPage({ searchParams }: LeadsPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const t = await getAdminTranslations();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const statusMsg = typeof params.status === "string" ? params.status : "";
  const query = normaliseQueryValue(params.q).toLowerCase();
  const statusFilter = normaliseQueryValue(params.leadStatus) || "all";
  const serviceFilter = normaliseQueryValue(params.service) || "all";
  const sourceFilter = normaliseQueryValue(params.source) || "all";
  const contactFilter = normaliseQueryValue(params.contact) || "all";
  const boroughFilter = normaliseQueryValue(params.borough) || "all";
  const page = Math.max(1, parseInt(normaliseQueryValue(params.page) || "1", 10));

  const prisma = getPrisma();
  const where = buildWhere({ statusFilter, serviceFilter, sourceFilter, contactFilter, boroughFilter, query });

  // Run stats + filtered leads in parallel
  const [
    totalCount,
    statusCounts,
    hasEmailCount,
    hasPhoneCount,
    hasWhatsAppCount,
    filteredCount,
    filteredLeads,
    boroughServiceRaw,
    noBoroughServiceRaw,
  ] = await Promise.all([
    // Total leads
    prisma.providerLead.count(),
    // Status breakdown
    prisma.providerLead.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Has real email
    prisma.providerLead.count({
      where: {
        contacts: {
          some: {
            channel: "EMAIL",
            NOT: [
              { value: { startsWith: "no-email-found@" } },
              { value: { startsWith: "scrape-failed@" } },
              { value: { contains: "@placeholder" } },
            ],
          },
        },
      },
    }),
    // Has phone
    prisma.providerLead.count({
      where: { contacts: { some: { channel: "PHONE" } } },
    }),
    // Has WhatsApp
    prisma.providerLead.count({
      where: { contacts: { some: { channel: "WHATSAPP" } } },
    }),
    // Filtered count (for pagination)
    prisma.providerLead.count({ where }),
    // Filtered leads with pagination
    prisma.providerLead.findMany({
      where,
      include: {
        contacts: true,
        _count: { select: { outreach: true, detailedNotes: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    // Borough x Service summary (leads WITH boroughs)
    prisma.$queryRaw<BoroughServiceRow[]>`
      SELECT
        b.borough,
        s.service,
        COUNT(*)::int AS count
      FROM "ProviderLead" pl,
        LATERAL unnest(pl.boroughs) AS b(borough),
        LATERAL unnest(pl.services) AS s(service)
      GROUP BY b.borough, s.service
      ORDER BY b.borough, s.service
    `,
    // Leads WITHOUT boroughs, grouped by service
    prisma.$queryRaw<BoroughServiceRow[]>`
      SELECT
        '_none_' AS borough,
        s.service,
        COUNT(*)::int AS count
      FROM "ProviderLead" pl,
        LATERAL unnest(pl.services) AS s(service)
      WHERE pl.boroughs = '{}'
      GROUP BY s.service
      ORDER BY s.service
    `,
  ]);

  // Derive stats from groupBy
  const statusMap = new Map(statusCounts.map((s) => [s.status, s._count]));
  const counts = {
    total: totalCount,
    new: statusMap.get("NEW") || 0,
    contacted: statusMap.get("CONTACTED") || 0,
    interested: (statusMap.get("INTERESTED") || 0) + (statusMap.get("ONBOARDING") || 0),
    converted: statusMap.get("CONVERTED") || 0,
    hasEmail: hasEmailCount,
    hasPhone: hasPhoneCount,
    hasWhatsApp: hasWhatsAppCount,
  };

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  // ── Build Borough x Service summary data ──────────────────────
  const allSummaryRows = [...boroughServiceRaw, ...noBoroughServiceRaw];
  // Map: borough -> service -> count
  const summaryMap = new Map<string, Map<string, number>>();
  const boroughTotals = new Map<string, number>();
  const serviceTotals = new Map<string, number>();
  let grandTotal = 0;

  for (const row of allSummaryRows) {
    if (!summaryMap.has(row.borough)) summaryMap.set(row.borough, new Map());
    summaryMap.get(row.borough)!.set(row.service, row.count);
    boroughTotals.set(row.borough, (boroughTotals.get(row.borough) || 0) + row.count);
    serviceTotals.set(row.service, (serviceTotals.get(row.service) || 0) + row.count);
    grandTotal += row.count;
  }

  // Sort boroughs: known boroughs first (alphabetical), then _none_
  const boroughNameMap = new Map(boroughPages.map((b) => [b.slug, b.name]));
  const summaryBoroughs = Array.from(summaryMap.keys()).sort((a, b) => {
    if (a === "_none_") return 1;
    if (b === "_none_") return -1;
    return (boroughNameMap.get(a) || a).localeCompare(boroughNameMap.get(b) || b);
  });

  const services = LEAD_SERVICE_CATEGORIES;

  // Build page URL helper
  function pageUrl(p: number) {
    const u = new URLSearchParams();
    if (query) u.set("q", query);
    if (statusFilter !== "all") u.set("leadStatus", statusFilter);
    if (serviceFilter !== "all") u.set("service", serviceFilter);
    if (sourceFilter !== "all") u.set("source", sourceFilter);
    if (boroughFilter !== "all") u.set("borough", boroughFilter);
    if (contactFilter !== "all") u.set("contact", contactFilter);
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return `/admin/leads${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.nav.acquisition}</p>
              <CardTitle className="mt-1 text-xl">{t.leads.title}</CardTitle>
              <CardDescription>{t.leads.description}</CardDescription>
            </div>
            <Badge variant="secondary">{filteredCount} {t.common.shown}</Badge>
          </div>
        </CardHeader>
        {(error || statusMsg) && (
          <CardContent>
            {error && <p className="text-sm leading-relaxed text-destructive">{error.replace(/_/g, " ")}</p>}
            {statusMsg && <p className="text-sm leading-relaxed text-green-600">{statusMsg.replace(/_/g, " ")}</p>}
          </CardContent>
        )}
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.totalLeads}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.new}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.contacted}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.contacted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.interested}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.interested}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.converted}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.converted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.hasEmail}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.hasEmail}</p>
            <p className="text-xs text-muted-foreground">{counts.total > 0 ? Math.round((counts.hasEmail / counts.total) * 100) : 0}{t.leads.percentOfLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.hasPhone}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.hasPhone}</p>
            <p className="text-xs text-muted-foreground">{counts.total > 0 ? Math.round((counts.hasPhone / counts.total) * 100) : 0}{t.leads.percentOfLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.hasWhatsApp}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{counts.hasWhatsApp}</p>
            <p className="text-xs text-muted-foreground">{counts.total > 0 ? Math.round((counts.hasWhatsApp / counts.total) * 100) : 0}{t.leads.percentOfLeads}</p>
          </CardContent>
        </Card>
      </div>

      {/* Borough x Service Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.leads.summaryTable}</CardTitle>
          <CardDescription>{t.leads.summaryTableDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="border-b text-left uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-background px-2 py-2 font-medium">{t.leads.borough}</th>
                  {services.map((s) => (
                    <th key={s} className="px-2 py-2 text-center font-medium">{t.serviceCategoryLabels[s] || s}</th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold">{t.leads.total}</th>
                </tr>
              </thead>
              <tbody>
                {summaryBoroughs.map((borough) => {
                  const serviceMap = summaryMap.get(borough)!;
                  const rowTotal = boroughTotals.get(borough) || 0;
                  const displayName = borough === "_none_" ? t.leads.noBorough : (boroughNameMap.get(borough) || borough);
                  return (
                    <tr key={borough} className="border-b hover:bg-muted/50">
                      <td className="sticky left-0 z-10 bg-background px-2 py-1.5 font-medium">
                        {borough === "_none_" ? (
                          <span className="italic text-muted-foreground">{displayName}</span>
                        ) : (
                          <Link
                            href={`/admin/leads?borough=${borough}`}
                            className="hover:underline"
                          >
                            {displayName}
                          </Link>
                        )}
                      </td>
                      {services.map((s) => {
                        const count = serviceMap.get(s) || 0;
                        return (
                          <td key={s} className="px-2 py-1.5 text-center">
                            {count > 0 ? (
                              <Link
                                href={borough === "_none_" ? `/admin/leads?service=${s}` : `/admin/leads?borough=${borough}&service=${s}`}
                                className={`inline-block min-w-[28px] rounded px-1.5 py-0.5 font-mono hover:underline ${
                                  count >= 20 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                  count >= 10 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                  count >= 5 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                  "text-muted-foreground"
                                }`}
                              >
                                {count}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center font-semibold">{rowTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="sticky left-0 z-10 bg-background px-2 py-2">{t.leads.total}</td>
                  {services.map((s) => (
                    <td key={s} className="px-2 py-2 text-center">{serviceTotals.get(s) || 0}</td>
                  ))}
                  <td className="px-2 py-2 text-center">{grandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Google Places Discovery */}
      <LeadDiscovery boroughs={boroughPages.map((b) => ({ slug: b.slug, name: b.name }))} />

      {/* Batch Discovery + Enrichment */}
      <BatchDiscovery />

      {/* Trustpilot Discovery */}
      <TrustpilotDiscovery />

      {/* Filters */}
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leads.filters}</p>
          <CardDescription>{t.leads.filtersDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_140px_140px_140px_160px_140px_auto]">
            <Input name="q" defaultValue={normaliseQueryValue(params.q)} placeholder={t.leads.searchPlaceholder} />
            <select
              name="leadStatus"
              defaultValue={statusFilter}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">{t.leads.allStatuses}</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.statusLabels[s] || s}
                </option>
              ))}
            </select>
            <select
              name="service"
              defaultValue={serviceFilter}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">{t.leads.allServices}</option>
              {LEAD_SERVICE_CATEGORIES.map((s) => (
                <option key={s} value={s}>
                  {t.serviceCategoryLabels[s] || s}
                </option>
              ))}
            </select>
            <select
              name="source"
              defaultValue={sourceFilter}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">{t.leads.allSources}</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {t.sourceLabels[s] || s}
                </option>
              ))}
            </select>
            <select
              name="borough"
              defaultValue={boroughFilter}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">{t.leads.allBoroughs}</option>
              {boroughPages.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              name="contact"
              defaultValue={contactFilter}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="all">{t.leads.allContacts}</option>
              <option value="email">{t.leads.hasEmailFilter}</option>
              <option value="phone">{t.leads.hasPhoneFilter}</option>
              <option value="whatsapp">{t.leads.hasWhatsAppFilter}</option>
              <option value="any">{t.leads.hasAnyContact}</option>
              <option value="none">{t.leads.noContacts}</option>
            </select>
            <div className="flex gap-2">
              <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
                {t.common.apply}
              </button>
              <Link href="/admin/leads" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                {t.common.clear}
              </Link>
              <a
                href={buildExportUrl(params)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-green-300 bg-green-50 px-4 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
                download
              >
                {t.leads.exportCsv}
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add Lead */}
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leads.addLead}</p>
          <CardDescription>{t.leads.addLeadDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLeadAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_150px_150px_auto]">
            <Input name="businessName" placeholder={t.leads.businessNamePlaceholder} required />
            <Input name="website" placeholder={t.leads.websitePlaceholder} />
            <select
              name="leadType"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="UNKNOWN">{t.leads.unknownType}</option>
              <option value="COMPANY">{t.leads.company}</option>
              <option value="SOLE_TRADER">{t.leads.soleTrader}</option>
            </select>
            <select
              name="source"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {t.sourceLabels[s] || s}
                </option>
              ))}
            </select>
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
              {t.leads.addLead}
            </button>
          </form>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              {t.leads.moreFields}
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.leads.moreFieldsHelp}
            </p>
          </details>
        </CardContent>
      </Card>

      {/* CSV Import */}
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leads.csvImport}</p>
          <CardDescription>
            {t.leads.csvImportDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={importLeadsCsvAction} className="space-y-3">
            <textarea
              name="csvText"
              rows={6}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm placeholder:text-muted-foreground"
              placeholder={t.leads.csvPlaceholder}
            />
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
              {t.leads.importCsv}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{t.leads.leadsTable}</CardTitle>
              <CardDescription>{t.leads.pageOf.replace("{page}", String(page)).replace("{totalPages}", String(totalPages)).replace("{filteredCount}", String(filteredCount))}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredLeads.map((lead) => {
              return (
                <div key={lead.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/leads/${lead.id}`} className="font-medium text-foreground hover:underline">
                        {lead.businessName}
                      </Link>
                      {lead.website && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{lead.website}</div>
                      )}
                    </div>
                    <Badge variant={statusBadgeVariant[lead.status] ?? "secondary"}>
                      {t.statusLabels[lead.status] || lead.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.score}</div>
                      <div className="mt-1 font-medium">{lead.score}/100</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.source}</div>
                      <div className="mt-1 font-medium">{t.sourceLabels[lead.source] || lead.source}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.services}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {lead.services.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px]">{t.serviceCategoryLabels[s] || s}</Badge>
                        ))}
                        {lead.services.length === 0 && <span className="text-muted-foreground">-</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.leads.outreach}</div>
                      <div className="mt-1 font-medium">{lead._count.outreach} {t.leads.events}</div>
                    </div>
                  </div>
                  <Link href={`/admin/leads/${lead.id}`} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
                    {t.common.open}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3 font-medium">{t.leads.business}</th>
                  <th className="px-3 py-3 font-medium">{t.leads.type}</th>
                  <th className="px-3 py-3 font-medium">{t.leads.services}</th>
                  <th className="px-3 py-3 font-medium">{t.leads.source}</th>
                  <th className="px-3 py-3 font-medium">{t.leads.score}</th>
                  <th className="px-3 py-3 font-medium">{t.common.status}</th>
                  <th className="px-3 py-3 font-medium">{t.leads.contacts}</th>
                  <th className="px-3 py-3 font-medium">{t.leads.outreach}</th>
                  <th className="px-3 py-3 font-medium">{t.leads.added}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const realContacts = lead.contacts.filter(
                    (c) => !c.value.startsWith("no-email-found@") && !c.value.startsWith("scrape-failed@") && !c.value.includes("@placeholder")
                  );
                  const primaryContact = realContacts.find((c) => c.isPrimary) || realContacts[0];
                  return (
                    <tr key={lead.id} className="border-b align-top">
                      <td className="px-3 py-4">
                        <Link href={`/admin/leads/${lead.id}`} className="font-medium text-foreground hover:underline">
                          {lead.businessName}
                        </Link>
                        {lead.website && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{lead.website}</div>
                        )}
                        {lead.boroughs.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lead.boroughs.slice(0, 3).map((b) => (
                              <Badge key={b} variant="outline" className="text-[10px] font-mono">{b}</Badge>
                            ))}
                            {lead.boroughs.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">+{lead.boroughs.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant="outline">{lead.leadType === "SOLE_TRADER" ? t.leads.soleTrader : lead.leadType === "COMPANY" ? t.leads.company : t.leads.unknown}</Badge>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {lead.services.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px]">{t.serviceCategoryLabels[s] || s}</Badge>
                          ))}
                          {lead.services.length === 0 && <span className="text-muted-foreground">-</span>}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{t.sourceLabels[lead.source] || lead.source}</td>
                      <td className="px-3 py-4">
                        <span className={`font-medium ${lead.score >= 70 ? "text-green-600" : lead.score >= 40 ? "text-yellow-600" : "text-muted-foreground"}`}>
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant={statusBadgeVariant[lead.status] ?? "secondary"}>
                          {t.statusLabels[lead.status] || lead.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {primaryContact ? (
                          <div className="text-xs">
                            <span className="font-mono">{primaryContact.channel}</span>
                            <div className="truncate max-w-[140px]">{primaryContact.value}</div>
                          </div>
                        ) : (
                          "-"
                        )}
                        {realContacts.length > 1 && (
                          <div className="text-xs text-muted-foreground">+{realContacts.length - 1} {t.leads.more}</div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{lead._count.outreach}</td>
                      <td className="px-3 py-4 text-xs text-muted-foreground">
                        {lead.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              {t.leads.noLeadsMatch}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={pageUrl(page - 1)}
                  className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent"
                >
                  {t.common.previous}
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {t.common.page} {page} {t.common.of} {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={pageUrl(page + 1)}
                  className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent"
                >
                  {t.common.next}
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
