"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OUTREACH_TEMPLATES, fillTemplate } from "@/lib/leads/outreach-templates";
import {
  LEAD_SERVICE_CATEGORIES,
  statusBadgeVariant,
} from "../constants";
import { useT } from "@/lib/i18n/context";
import { boroughPages } from "@/lib/seo/borough-pages";
import { sendBatchEmailAction } from "./email-actions";
import type { LeadEmailData } from "./email-actions";

const emailTemplates = OUTREACH_TEMPLATES.filter((t) => t.channel === "EMAIL");

type Props = {
  leads: LeadEmailData[];
};

export function EmailOutreach({ leads }: Props) {
  const t = useT();

  const [templateId, setTemplateId] = useState(emailTemplates[0]?.id || "");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [boroughFilter, setBoroughFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    totalSent: number;
    totalFailed: number;
    errors: string[];
    message: string;
  } | null>(null);

  const selectedTemplate = emailTemplates.find((t) => t.id === templateId);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (serviceFilter !== "all" && !lead.services.includes(serviceFilter)) return false;
      if (boroughFilter !== "all" && !lead.boroughs.includes(boroughFilter)) return false;
      if (query) {
        const searchable = [lead.businessName, lead.email, ...lead.boroughs].join(" ").toLowerCase();
        if (!searchable.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, serviceFilter, boroughFilter, query]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((l) => l.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleSend() {
    if (selectedIds.size === 0 || !templateId) return;
    if (!confirm(t.emailOutreach.confirmSend.replace("{count}", String(selectedIds.size)) + `\n\nTemplate: ${selectedTemplate?.name}`)) {
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const res = await sendBatchEmailAction({
        templateId,
        leadIds: Array.from(selectedIds),
      });
      setResult({
        totalSent: res.totalSent,
        totalFailed: res.totalFailed,
        errors: res.errors,
        message: res.message,
      });
      if (res.totalSent > 0) {
        setSelectedIds(new Set());
      }
    } catch (error) {
      setResult({
        totalSent: 0,
        totalFailed: selectedIds.size,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        message: "Batch send failed",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.nav.acquisition}</p>
              <CardTitle className="mt-1 text-xl">{t.emailOutreach.title}</CardTitle>
              <CardDescription>
                {t.emailOutreach.description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{leads.length} {t.emailOutreach.leadsWithEmail}</Badge>
              <Badge variant="outline">{filtered.length} shown</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.emailOutreach.settings}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.emailOutreach.emailTemplate}</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Day {t.cadenceDay})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.emailOutreach.service}</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">{t.emailOutreach.allServices}</option>
                {LEAD_SERVICE_CATEGORIES.map((s) => (
                  <option key={s} value={s}>
                    {t.serviceCategoryLabels[s] || s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.emailOutreach.borough}</label>
              <select
                value={boroughFilter}
                onChange={(e) => setBoroughFilter(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">{t.emailOutreach.allBoroughs}</option>
                {boroughPages.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.emailOutreach.searchPlaceholder}</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.emailOutreach.searchPlaceholder}
                className="mt-1"
              />
            </div>
          </div>

          {/* Template preview */}
          {selectedTemplate && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t.emailOutreach.subject} <span className="font-mono">{selectedTemplate.subject || t.emailOutreach.noSubject}</span>
              </p>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{selectedTemplate.body}</pre>
            </div>
          )}

          {/* Send controls */}
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <button
              onClick={selectAll}
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent"
            >
              {t.emailOutreach.selectAll} ({filtered.length})
            </button>
            <button
              onClick={deselectAll}
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent"
            >
              {t.emailOutreach.deselectAll}
            </button>
            <Badge variant="secondary">{selectedIds.size} {t.emailOutreach.selected}</Badge>
            <button
              onClick={handleSend}
              disabled={sending || selectedIds.size === 0}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-white shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  {t.emailOutreach.sending}
                </span>
              ) : (
                t.emailOutreach.sendEmails.replace("{count}", String(selectedIds.size))
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg border px-4 py-3 space-y-2 ${
                result.totalFailed === 0
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
              }`}
            >
              <p className="text-sm font-medium">{result.message}</p>
              <div className="flex gap-2 text-xs">
                <Badge variant="default">{result.totalSent} {t.emailOutreach.sent}</Badge>
                {result.totalFailed > 0 && <Badge variant="destructive">{result.totalFailed} {t.emailOutreach.failed}</Badge>}
              </div>
              {result.errors.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    {result.errors.length} {t.emailOutreach.errorsLabel}
                  </summary>
                  <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.emailOutreach.leadsSection} ({filtered.length})</CardTitle>
          <CardDescription>{t.emailOutreach.leadsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              {t.emailOutreach.noLeadsMatch}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3 font-medium w-10">
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))}
                          onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-3 font-medium">{t.emailOutreach.tableHeaders.business}</th>
                      <th className="px-3 py-3 font-medium">{t.emailOutreach.tableHeaders.email}</th>
                      <th className="px-3 py-3 font-medium">{t.emailOutreach.tableHeaders.services}</th>
                      <th className="px-3 py-3 font-medium">{t.emailOutreach.tableHeaders.score}</th>
                      <th className="px-3 py-3 font-medium">{t.emailOutreach.tableHeaders.status}</th>
                      <th className="px-3 py-3 font-medium">{t.emailOutreach.tableHeaders.preview}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => {
                      const serviceLabel = lead.services[0]
                        ? t.serviceCategoryLabels[lead.services[0]] || lead.services[0]
                        : undefined;
                      const previewSubject = selectedTemplate?.subject
                        ? fillTemplate(selectedTemplate.subject, {
                            businessName: lead.businessName,
                            borough: lead.boroughs[0] || undefined,
                            service: serviceLabel,
                          })
                        : "";

                      return (
                        <tr key={lead.id} className="border-b align-top">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(lead.id)}
                              onChange={() => toggleSelect(lead.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                              {lead.businessName}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{lead.email}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {lead.services.map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px]">
                                  {t.serviceCategoryLabels[s] || s}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`font-medium ${lead.score >= 70 ? "text-green-600" : lead.score >= 40 ? "text-yellow-600" : "text-muted-foreground"}`}>
                              {lead.score}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={statusBadgeVariant[lead.status] ?? "secondary"}>
                              {t.statusLabels[lead.status] || lead.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                            {previewSubject}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filtered.map((lead) => (
                  <div key={lead.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                            {lead.businessName}
                          </Link>
                          <Badge variant={statusBadgeVariant[lead.status] ?? "secondary"}>
                            {t.statusLabels[lead.status] || lead.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{lead.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>{t.emailOutreach.helpText}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          &larr; {t.emailOutreach.backToLeads}
        </Link>
      </div>
    </div>
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
