"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { discoverTrustpilotAction, importTrustpilotLeadsAction } from "./trustpilot-actions";
import { LEAD_SERVICE_CATEGORIES } from "./constants";
import { useT } from "@/lib/i18n/context";
import type { LeadServiceCategory } from "@prisma/client";
import type { TrustpilotLead } from "@/lib/leads/trustpilot-scraper";

export function TrustpilotDiscovery() {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [service, setService] = useState<LeadServiceCategory>("CLEANING");
  const [results, setResults] = useState<TrustpilotLead[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchInfo, setSearchInfo] = useState<{
    total: number;
    dupes: number;
    pagesScraped: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  // Batch mode: scrape all services at once
  const [batchMode, setBatchMode] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentService: string;
    results: Array<{ service: string; found: number; dupes: number }>;
    totalImported: number;
    totalSkipped: number;
  } | null>(null);

  function handleSearch() {
    setError("");
    setResults(null);
    setSelected(new Set());
    setSearchInfo(null);
    setImportResult(null);

    startTransition(async () => {
      const res = await discoverTrustpilotAction(service);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.result.leads);
      setSearchInfo({
        total: res.result.totalFromTrustpilot,
        dupes: res.result.duplicatesSkipped,
        pagesScraped: res.result.pagesScraped,
      });
      // Pre-select all non-duplicate leads
      const newSelected = new Set<string>();
      for (const lead of res.result.leads) {
        if (!lead.alreadyExists) newSelected.add(lead.trustpilotUrl);
      }
      setSelected(newSelected);
    });
  }

  function handleBatch() {
    setError("");
    setResults(null);
    setSearchInfo(null);
    setImportResult(null);
    setBatchProgress({
      current: 0,
      total: LEAD_SERVICE_CATEGORIES.length,
      currentService: "",
      results: [],
      totalImported: 0,
      totalSkipped: 0,
    });

    startTransition(async () => {
      let totalImported = 0;
      let totalSkipped = 0;
      const batchResults: Array<{ service: string; found: number; dupes: number }> = [];

      for (let i = 0; i < LEAD_SERVICE_CATEGORIES.length; i++) {
        const svc = LEAD_SERVICE_CATEGORIES[i];
        setBatchProgress((prev) =>
          prev
            ? {
                ...prev,
                current: i,
                currentService: svc,
              }
            : null,
        );

        // Discover
        const discoverRes = await discoverTrustpilotAction(svc as LeadServiceCategory, 5);
        if (!discoverRes.ok) {
          batchResults.push({ service: svc, found: 0, dupes: 0 });
          continue;
        }

        const newLeads = discoverRes.result.leads.filter((l) => !l.alreadyExists);
        batchResults.push({
          service: svc,
          found: discoverRes.result.totalFromTrustpilot,
          dupes: discoverRes.result.duplicatesSkipped,
        });

        // Auto-import new leads
        if (newLeads.length > 0) {
          const importRes = await importTrustpilotLeadsAction(
            newLeads.map((l) => ({
              businessName: l.businessName,
              website: l.website,
              email: l.email,
              phone: l.phone,
              trustpilotUrl: l.trustpilotUrl,
              trustScore: l.trustScore,
              reviewCount: l.reviewCount,
              service: l.service,
            })),
          );
          if (importRes.ok) {
            totalImported += importRes.imported;
            totalSkipped += importRes.skipped;
          }
        }

        setBatchProgress((prev) =>
          prev
            ? {
                ...prev,
                current: i + 1,
                results: batchResults,
                totalImported,
                totalSkipped,
              }
            : null,
        );
      }

      router.refresh();
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!results) return;
    const all = new Set(results.filter((l) => !l.alreadyExists).map((l) => l.trustpilotUrl));
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
      .filter((l) => selected.has(l.trustpilotUrl) && !l.alreadyExists)
      .map((l) => ({
        businessName: l.businessName,
        website: l.website,
        email: l.email,
        phone: l.phone,
        trustpilotUrl: l.trustpilotUrl,
        trustScore: l.trustScore,
        reviewCount: l.reviewCount,
        service: l.service,
      }));

    startTransition(async () => {
      const res = await importTrustpilotLeadsAction(leadsToImport);
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
          {t.trustpilot.title}
        </p>
        <CardDescription>{t.trustpilot.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBatchMode(false)}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              !batchMode
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t.trustpilot.singleService}
          </button>
          <button
            onClick={() => setBatchMode(true)}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              batchMode
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t.trustpilot.batchAllServices}
          </button>
        </div>

        {/* Single service mode */}
        {!batchMode && (
          <>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.trustpilot.service}
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value as LeadServiceCategory)}
                  className="flex h-9 w-full min-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {LEAD_SERVICE_CATEGORIES.map((s) => (
                    <option key={s} value={s}>
                      {t.serviceCategoryLabels[s] || s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                disabled={isPending}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending && !results
                  ? t.trustpilot.searching
                  : t.trustpilot.searchTrustpilot}
              </button>
            </div>
          </>
        )}

        {/* Batch mode */}
        {batchMode && (
          <div className="space-y-3">
            <button
              onClick={handleBatch}
              disabled={isPending}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending
                ? t.trustpilot.running
                : t.trustpilot.runBatchDiscovery}
            </button>

            {batchProgress && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {batchProgress.current}/{batchProgress.total}
                  </span>
                  {batchProgress.currentService && isPending && (
                    <span className="text-xs text-muted-foreground">
                      {t.serviceCategoryLabels[batchProgress.currentService] ||
                        batchProgress.currentService}
                      ...
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    }}
                  />
                </div>

                {/* Per-service results */}
                {batchProgress.results.length > 0 && (
                  <div className="text-xs space-y-1">
                    {batchProgress.results.map((r) => (
                      <div key={r.service} className="flex items-center gap-2">
                        <span className="font-medium w-36 truncate">
                          {t.serviceCategoryLabels[r.service] || r.service}
                        </span>
                        <Badge variant="secondary">{r.found} {t.trustpilot.found}</Badge>
                        {r.dupes > 0 && (
                          <Badge variant="outline">
                            {r.dupes} {t.trustpilot.duplicates}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Final summary */}
                {!isPending && batchProgress.current === batchProgress.total && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t.trustpilot.batchComplete
                        .replace("{imported}", String(batchProgress.totalImported))
                        .replace("{skipped}", String(batchProgress.totalSkipped))}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Import result (single mode) */}
        {importResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm text-green-700 dark:text-green-300">
              {t.trustpilot.importedLeads
                .replace("{imported}", String(importResult.imported))
                .replace("{skipped}", String(importResult.skipped))}
            </p>
          </div>
        )}

        {/* Search info */}
        {searchInfo && (
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="secondary">
              {searchInfo.total} {t.trustpilot.found}
            </Badge>
            {searchInfo.dupes > 0 && (
              <Badge variant="outline">
                {searchInfo.dupes} {t.trustpilot.duplicates}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {searchInfo.pagesScraped} {t.trustpilot.pagesScraped}
            </span>
          </div>
        )}

        {/* Results list (single mode only) */}
        {!batchMode && results && results.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-xs text-primary hover:underline"
              >
                {t.trustpilot.selectAllNew}
              </button>
              <button
                onClick={selectNone}
                className="text-xs text-muted-foreground hover:underline"
              >
                {t.trustpilot.deselectAll}
              </button>
              <span className="text-xs text-muted-foreground">
                {selected.size} {t.trustpilot.selected}
              </span>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 rounded-lg border p-2">
              {results.map((lead) => (
                <label
                  key={lead.trustpilotUrl}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    lead.alreadyExists
                      ? "opacity-50 bg-muted/30"
                      : selected.has(lead.trustpilotUrl)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(lead.trustpilotUrl)}
                    onChange={() => toggleSelect(lead.trustpilotUrl)}
                    disabled={lead.alreadyExists}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {lead.businessName}
                      </span>
                      {lead.alreadyExists && (
                        <Badge variant="destructive" className="text-[10px]">
                          {t.trustpilot.alreadyInDb}
                        </Badge>
                      )}
                      {lead.trustScore && (
                        <Badge variant="outline" className="text-[10px]">
                          {lead.trustScore}/5 ({lead.reviewCount}{" "}
                          {t.trustpilot.reviews})
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {lead.email && (
                        <span className="font-mono text-green-600 dark:text-green-400">
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="font-mono">{lead.phone}</span>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[200px]"
                        >
                          {lead.website
                            .replace(/^https?:\/\//, "")
                            .replace(/\/$/, "")}
                        </a>
                      )}
                      <a
                        href={lead.trustpilotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Trustpilot
                      </a>
                    </div>
                    {lead.city && (
                      <p className="text-xs text-muted-foreground">
                        {lead.city}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={selected.size === 0 || isPending}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending && results
                ? t.trustpilot.importing
                : t.trustpilot.importLeads.replace(
                    "{count}",
                    String(selected.size),
                  )}
            </button>
          </>
        )}

        {!batchMode && results && results.length === 0 && (
          <div className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            {t.trustpilot.noResults}
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t.trustpilot.helpText}
        </p>
      </CardContent>
    </Card>
  );
}
