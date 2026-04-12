"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/context";
import {
  getBatchInfoAction,
  runDiscoveryChunkAction,
  runEnrichChunkAction,
  resetEnrichmentAction,
} from "./batch-actions";

type Phase = "idle" | "discovery" | "enrichment" | "done" | "error";

type Stats = {
  searchesDone: number;
  totalCombos: number;
  placesFound: number;
  leadsImported: number;
  leadsSkipped: number;
  leadsEnriched: number;
  contactsAdded: number;
  errors: string[];
};

const emptyStats: Stats = {
  searchesDone: 0,
  totalCombos: 0,
  placesFound: 0,
  leadsImported: 0,
  leadsSkipped: 0,
  leadsEnriched: 0,
  contactsAdded: 0,
  errors: [],
};

export function BatchDiscovery() {
  const t = useT();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [statusMsg, setStatusMsg] = useState("");
  const [enrichOnly, setEnrichOnly] = useState(false);

  async function handleRunAll() {
    setPhase("discovery");
    setStats(emptyStats);
    setStatusMsg(t.batch.statusPreparing);
    setEnrichOnly(false);

    // Get total combos
    const info = await getBatchInfoAction();
    const totalCombos = info.totalCombos;
    setStats((s) => ({ ...s, totalCombos }));

    // Phase 1: Discovery — call chunks
    let index = 0;
    let runningStats = { ...emptyStats, totalCombos };

    while (index < totalCombos) {
      setStatusMsg(`${t.batch.statusSearching} ${index + 1}/${totalCombos} (${Math.round((index / totalCombos) * 100)}%)`);

      const result = await runDiscoveryChunkAction(index);
      index += result.searchesDone || 8; // advance by chunk size even if some failed

      runningStats = {
        ...runningStats,
        searchesDone: runningStats.searchesDone + result.searchesDone,
        placesFound: runningStats.placesFound + result.placesFound,
        leadsImported: runningStats.leadsImported + result.leadsImported,
        leadsSkipped: runningStats.leadsSkipped + result.leadsSkipped,
        errors: [...runningStats.errors, ...result.errors],
      };
      setStats({ ...runningStats });

      if (result.shouldStop) {
        setPhase("error");
        setStatusMsg(result.message);
        return;
      }
    }

    // Phase 2: Enrichment
    setPhase("enrichment");
    setStatusMsg(t.batch.statusScraping);

    let hasMore = true;
    let round = 0;
    while (hasMore) {
      round++;
      setStatusMsg(t.batch.statusScrapingBatch.replace("{batch}", String(round)));

      const enrichResult = await runEnrichChunkAction(0);
      runningStats = {
        ...runningStats,
        leadsEnriched: runningStats.leadsEnriched + enrichResult.leadsEnriched,
        contactsAdded: runningStats.contactsAdded + enrichResult.contactsAdded,
      };
      setStats({ ...runningStats });
      hasMore = enrichResult.hasMore;
    }

    setPhase("done");
    setStatusMsg(t.batch.statusDone);
    router.refresh();
  }

  async function handleEnrichOnly() {
    setPhase("enrichment");
    setStats(emptyStats);
    setStatusMsg(t.batch.statusScraping);
    setEnrichOnly(true);

    let hasMore = true;
    let round = 0;
    let runningStats = { ...emptyStats };

    while (hasMore) {
      round++;
      setStatusMsg(t.batch.statusScrapingBatch.replace("{batch}", String(round)));

      const enrichResult = await runEnrichChunkAction(0);
      runningStats = {
        ...runningStats,
        leadsEnriched: runningStats.leadsEnriched + enrichResult.leadsEnriched,
        contactsAdded: runningStats.contactsAdded + enrichResult.contactsAdded,
      };
      setStats({ ...runningStats });
      hasMore = enrichResult.hasMore;
    }

    setPhase("done");
    setStatusMsg(t.batch.statusDone);
    router.refresh();
  }

  async function handleResetAndReenrich() {
    if (!confirm(t.batch.confirmReset)) {
      return;
    }

    setPhase("enrichment");
    setStats(emptyStats);
    setEnrichOnly(true);
    setStatusMsg(t.batch.statusScraping);

    const resetResult = await resetEnrichmentAction();
    if (!resetResult.ok) {
      setPhase("error");
      setStatusMsg(resetResult.message);
      return;
    }

    setStatusMsg(`已清除 ${resetResult.placeholderEmailsDeleted} 個 placeholder，重置 ${resetResult.leadsReset} 個 lead。開始重新 scrape...`);

    // Now run enrichment
    let hasMore = true;
    let round = 0;
    let runningStats = { ...emptyStats };

    while (hasMore) {
      round++;
      setStatusMsg(`重新 scraping... 第 ${round} 批（已找到 ${runningStats.contactsAdded} 個聯絡方式）`);

      const enrichResult = await runEnrichChunkAction(0);
      runningStats = {
        ...runningStats,
        leadsEnriched: runningStats.leadsEnriched + enrichResult.leadsEnriched,
        contactsAdded: runningStats.contactsAdded + enrichResult.contactsAdded,
      };
      setStats({ ...runningStats });
      hasMore = enrichResult.hasMore;
    }

    setPhase("done");
    setStatusMsg(`重新 enrichment 完成！清除咗 ${resetResult.placeholderEmailsDeleted} 個 placeholder，新搵到 ${runningStats.contactsAdded} 個聯絡方式。`);
    router.refresh();
  }

  const isRunning = phase === "discovery" || phase === "enrichment";
  const progressPct = stats.totalCombos > 0
    ? Math.round((stats.searchesDone / stats.totalCombos) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.batch.title}
        </p>
        <CardDescription>
          {t.batch.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRunAll}
            disabled={isRunning}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-white shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {isRunning && !enrichOnly ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {t.batch.running}
              </span>
            ) : (
              t.batch.runFull
            )}
          </button>
          <button
            onClick={handleEnrichOnly}
            disabled={isRunning}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {isRunning && enrichOnly ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {t.batch.scraping}
              </span>
            ) : (
              t.batch.enrichOnly
            )}
          </button>
          <button
            onClick={handleResetAndReenrich}
            disabled={isRunning}
            className="inline-flex h-9 items-center justify-center rounded-md border border-orange-300 bg-orange-50 px-5 text-sm font-medium text-orange-700 shadow-sm hover:bg-orange-100 disabled:opacity-50 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
          >
            {t.batch.resetReenrich}
          </button>
        </div>

        {/* Progress bar + status */}
        {isRunning && (
          <div className="space-y-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{statusMsg}</p>
              {phase === "discovery" && stats.totalCombos > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
                    <span>{stats.searchesDone} / {stats.totalCombos} {t.batch.searches}</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="w-full rounded-full bg-blue-200 dark:bg-blue-800 h-2">
                    <div
                      className="rounded-full bg-blue-600 dark:bg-blue-400 h-2 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Live stats */}
            <div className="flex flex-wrap gap-2 text-xs">
              {stats.placesFound > 0 && <Badge variant="secondary">{stats.placesFound} {t.batch.placesFound}</Badge>}
              {stats.leadsImported > 0 && <Badge variant="default">{stats.leadsImported} {t.batch.imported}</Badge>}
              {stats.leadsSkipped > 0 && <Badge variant="outline">{stats.leadsSkipped} {t.batch.duplicates}</Badge>}
              {stats.leadsEnriched > 0 && <Badge variant="default">{stats.leadsEnriched} {t.batch.enriched}</Badge>}
              {stats.contactsAdded > 0 && <Badge variant="default">{stats.contactsAdded} {t.batch.contactsAdded}</Badge>}
            </div>
          </div>
        )}

        {/* Done */}
        {phase === "done" && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 space-y-2 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">{statusMsg}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {stats.searchesDone > 0 && <Badge variant="secondary">{stats.searchesDone} {t.batch.searches}</Badge>}
              {stats.placesFound > 0 && <Badge variant="secondary">{stats.placesFound} {t.batch.placesFound}</Badge>}
              {stats.leadsImported > 0 && <Badge variant="default">{stats.leadsImported} {t.batch.leadsImported}</Badge>}
              {stats.leadsSkipped > 0 && <Badge variant="outline">{stats.leadsSkipped} {t.batch.duplicatesSkipped}</Badge>}
              {stats.leadsEnriched > 0 && <Badge variant="default">{stats.leadsEnriched} {t.batch.leadsEnriched}</Badge>}
              {stats.contactsAdded > 0 && <Badge variant="default">{stats.contactsAdded} {t.batch.contactsAdded}</Badge>}
            </div>
            {stats.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {stats.errors.length} {t.batch.errors}
                </summary>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {stats.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 space-y-2">
            <p className="text-sm text-destructive">{statusMsg}</p>
            {stats.leadsImported > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.batch.beforeError.replace("{imported}", String(stats.leadsImported)).replace("{skipped}", String(stats.leadsSkipped))}
              </p>
            )}
            {stats.errors.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {t.batch.errorDetails}
                </summary>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {stats.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>{t.batch.helpText}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
