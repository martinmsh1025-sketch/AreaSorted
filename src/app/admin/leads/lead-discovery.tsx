"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { discoverLeadsAction, importDiscoveredLeadsAction } from "./discovery-actions";
import { LEAD_SERVICE_CATEGORIES } from "./constants";
import { useT } from "@/lib/i18n/context";
import type { LeadServiceCategory } from "@prisma/client";
import type { DiscoveredLead } from "@/lib/leads/discovery";

const serviceCategoryLabels: Record<string, string> = {
  CLEANING: "Cleaning",
  PEST_CONTROL: "Pest control",
  HANDYMAN: "Handyman",
  FURNITURE_ASSEMBLY: "Furniture assembly",
  WASTE_REMOVAL: "Waste removal",
  GARDEN_MAINTENANCE: "Garden maintenance",
};

type Props = {
  boroughs: Array<{ slug: string; name: string }>;
};

export function LeadDiscovery({ boroughs }: Props) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [borough, setBorough] = useState("");
  const [service, setService] = useState<LeadServiceCategory>("CLEANING");
  const [results, setResults] = useState<DiscoveredLead[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchInfo, setSearchInfo] = useState<{ query: string; total: number; dupes: number } | null>(null);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  function handleSearch() {
    if (!borough) return;
    setError("");
    setResults(null);
    setSelected(new Set());
    setSearchInfo(null);
    setImportResult(null);

    startTransition(async () => {
      const res = await discoverLeadsAction(borough, service);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.result.leads);
      setSearchInfo({
        query: res.result.query,
        total: res.result.totalFromApi,
        dupes: res.result.duplicatesSkipped,
      });
      // Pre-select all non-duplicate leads
      const newSelected = new Set<string>();
      for (const lead of res.result.leads) {
        if (!lead.alreadyExists) newSelected.add(lead.placeId);
      }
      setSelected(newSelected);
    });
  }

  function toggleSelect(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  function selectAll() {
    if (!results) return;
    const all = new Set(results.filter((l) => !l.alreadyExists).map((l) => l.placeId));
    setSelected(all);
  }

  function selectNone() {
    setSelected(new Set());
  }

  function handleImport() {
    if (!results || selected.size === 0) return;
    setError("");
    setImportResult(null);

    const leadsToImport = results
      .filter((l) => selected.has(l.placeId) && !l.alreadyExists)
      .map((l) => ({
        businessName: l.businessName,
        address: l.address,
        phone: l.phone,
        website: l.website,
        googleMapsUrl: l.googleMapsUrl,
        rating: l.rating,
        reviewCount: l.reviewCount,
        placeId: l.placeId,
        borough: l.borough,
        service: l.service,
      }));

    startTransition(async () => {
      const res = await importDiscoveredLeadsAction(leadsToImport);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setImportResult({ imported: res.imported, skipped: res.skipped });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.discovery.title}
        </p>
        <CardDescription>
          {t.discovery.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search controls */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.discovery.borough}</label>
            <select
              value={borough}
              onChange={(e) => setBorough(e.target.value)}
              className="flex h-9 w-full min-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">{t.discovery.selectBorough}</option>
              {boroughs.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.discovery.service}</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value as LeadServiceCategory)}
              className="flex h-9 w-full min-w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {LEAD_SERVICE_CATEGORIES.map((s) => (
                <option key={s} value={s}>{t.serviceCategoryLabels[s] || serviceCategoryLabels[s] || s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={!borough || isPending}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending && !results ? t.discovery.searching : t.discovery.searchGoogleMaps}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm text-green-700 dark:text-green-300">
              {t.discovery.importedLeads.replace("{imported}", String(importResult.imported)).replace("{skipped}", String(importResult.skipped))}
              {" "}{t.discovery.leadsListUpdated}
            </p>
          </div>
        )}

        {/* Search info */}
        {searchInfo && (
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-muted-foreground">
              {t.discovery.query} <span className="font-mono text-xs">{searchInfo.query}</span>
            </span>
            <Badge variant="secondary">{searchInfo.total} {t.discovery.found}</Badge>
            {searchInfo.dupes > 0 && (
              <Badge variant="outline">{searchInfo.dupes} {t.discovery.alreadyInDb}</Badge>
            )}
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="text-xs text-primary hover:underline">{t.discovery.selectAllNew}</button>
              <button onClick={selectNone} className="text-xs text-muted-foreground hover:underline">{t.discovery.deselectAll}</button>
              <span className="text-xs text-muted-foreground">{selected.size} {t.discovery.selected}</span>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 rounded-lg border p-2">
              {results.map((lead) => (
                <label
                  key={lead.placeId}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    lead.alreadyExists
                      ? "opacity-50 bg-muted/30"
                      : selected.has(lead.placeId)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(lead.placeId)}
                    onChange={() => toggleSelect(lead.placeId)}
                    disabled={lead.alreadyExists}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{lead.businessName}</span>
                      {lead.alreadyExists && <Badge variant="destructive" className="text-[10px]">{t.discovery.alreadyInDbBadge}</Badge>}
                      {lead.rating && (
                        <Badge variant="outline" className="text-[10px]">
                          {lead.rating} ({lead.reviewCount} {t.discovery.reviews})
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{lead.address}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {lead.phone && <span className="font-mono">{lead.phone}</span>}
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                          {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                      {lead.googleMapsUrl && (
                        <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {t.discovery.googleMaps}
                        </a>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={selected.size === 0 || isPending}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending && results ? t.discovery.importing : t.discovery.importLeads.replace("{count}", String(selected.size))}
            </button>
          </>
        )}

        {results && results.length === 0 && (
          <div className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            {t.discovery.noResults}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
