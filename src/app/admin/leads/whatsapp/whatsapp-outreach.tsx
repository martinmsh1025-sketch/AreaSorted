"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  OUTREACH_TEMPLATES,
  fillTemplate,
} from "@/lib/leads/outreach-templates";
import {
  LEAD_SERVICE_CATEGORIES,
  serviceCategoryLabels,
  statusBadgeVariant,
} from "../constants";
import { useT } from "@/lib/i18n/context";
import { boroughPages } from "@/lib/seo/borough-pages";

type LeadWithPhone = {
  id: string;
  businessName: string;
  services: string[];
  boroughs: string[];
  website: string | null;
  status: string;
  score: number;
  phone: string;
  confirmedWa: string | null;
  mobile: string | null;
};

type Props = {
  leads: LeadWithPhone[];
};

// WhatsApp templates from outreach-templates.ts
const whatsappTemplates = OUTREACH_TEMPLATES.filter((t) => t.channel === "WHATSAPP");

function normalisePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");
  // Convert UK numbers: 07... → 447..., 0... → 44...
  if (digits.startsWith("0")) {
    digits = "44" + digits.slice(1);
  }
  // If doesn't start with country code, assume UK
  if (!digits.startsWith("44") && digits.length === 10) {
    digits = "44" + digits;
  }
  return digits;
}

function buildWaLink(phone: string, message: string): string {
  const normPhone = normalisePhone(phone);
  return `https://wa.me/${normPhone}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppOutreach({ leads }: Props) {
  const t = useT();
  const [templateId, setTemplateId] = useState(whatsappTemplates[0]?.id || "");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [boroughFilter, setBoroughFilter] = useState("all");
  const [phoneType, setPhoneType] = useState<"all" | "confirmed" | "mobile">("all");
  const [query, setQuery] = useState("");

  const selectedTemplate = whatsappTemplates.find((t) => t.id === templateId);

  const confirmedCount = useMemo(() => leads.filter((l) => l.confirmedWa).length, [leads]);
  const mobileCount = useMemo(() => leads.filter((l) => l.mobile && !l.confirmedWa).length, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (serviceFilter !== "all" && !lead.services.includes(serviceFilter)) return false;
      if (boroughFilter !== "all" && !lead.boroughs.includes(boroughFilter)) return false;
      if (phoneType === "confirmed" && !lead.confirmedWa) return false;
      if (phoneType === "mobile" && !lead.mobile) return false;
      if (query) {
        const searchable = [lead.businessName, lead.phone, ...lead.boroughs].join(" ").toLowerCase();
        if (!searchable.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, serviceFilter, boroughFilter, phoneType, query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acquisition</p>
              <CardTitle className="mt-1 text-xl">{t.whatsappOutreach.title}</CardTitle>
              <CardDescription>
                {t.whatsappOutreach.description}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="bg-green-600">{confirmedCount} {t.whatsappOutreach.confirmedWa}</Badge>
              <Badge variant="secondary">{mobileCount} mobile only</Badge>
              <Badge variant="outline">{filtered.length} shown</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.whatsappOutreach.settings}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            {/* Template selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.whatsappOutreach.messageTemplate}</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {whatsappTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Day {t.cadenceDay})
                  </option>
                ))}
              </select>
            </div>
            {/* Phone type filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.whatsappOutreach.phoneType}</label>
              <select
                value={phoneType}
                onChange={(e) => setPhoneType(e.target.value as "all" | "confirmed" | "mobile")}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">{t.whatsappOutreach.all} ({leads.length})</option>
                <option value="confirmed">{t.whatsappOutreach.confirmedWhatsApp} ({confirmedCount})</option>
                <option value="mobile">{t.whatsappOutreach.mobile07} ({leads.filter((l) => l.mobile).length})</option>
              </select>
            </div>
            {/* Service filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.whatsappOutreach.service}</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">{t.whatsappOutreach.allServices}</option>
                {LEAD_SERVICE_CATEGORIES.map((s) => (
                  <option key={s} value={s}>
                    {t.serviceCategoryLabels[s] || serviceCategoryLabels[s] || s}
                  </option>
                ))}
              </select>
            </div>
            {/* Borough filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.whatsappOutreach.borough}</label>
              <select
                value={boroughFilter}
                onChange={(e) => setBoroughFilter(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">{t.whatsappOutreach.allBoroughs}</option>
                {boroughPages.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Search */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.whatsappOutreach.searchPlaceholder}
                className="mt-1"
              />
            </div>
          </div>

          {/* Template preview */}
          {selectedTemplate && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.whatsappOutreach.messagePreview}</p>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{selectedTemplate.body}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead list with wa.me links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.whatsappOutreach.leadsSection} ({filtered.length})</CardTitle>
          <CardDescription>{t.whatsappOutreach.leadsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              {t.whatsappOutreach.noLeadsMatch}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3 font-medium">{t.whatsappOutreach.tableHeaders.business}</th>
                      <th className="px-3 py-3 font-medium">{t.whatsappOutreach.tableHeaders.phone}</th>
                      <th className="px-3 py-3 font-medium">{t.whatsappOutreach.tableHeaders.type}</th>
                      <th className="px-3 py-3 font-medium">{t.whatsappOutreach.tableHeaders.services}</th>
                      <th className="px-3 py-3 font-medium">{t.whatsappOutreach.tableHeaders.score}</th>
                      <th className="px-3 py-3 font-medium">{t.whatsappOutreach.tableHeaders.status}</th>
                      <th className="px-3 py-3 font-medium">{t.whatsappOutreach.tableHeaders.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => {
                      const message = selectedTemplate
                        ? fillTemplate(selectedTemplate.body, {
                            businessName: lead.businessName,
                            borough: lead.boroughs[0] || undefined,
                            service: lead.services[0]
                              ? t.serviceCategoryLabels[lead.services[0]] || serviceCategoryLabels[lead.services[0]] || lead.services[0]
                              : undefined,
                          })
                        : "";
                      // Use confirmed WhatsApp link directly, or build wa.me from mobile
                      const waLink = lead.confirmedWa
                        ? (lead.confirmedWa.startsWith("http")
                            ? lead.confirmedWa
                            : `https://wa.me/${normalisePhone(lead.confirmedWa)}?text=${encodeURIComponent(message)}`)
                        : buildWaLink(lead.phone, message);
                      const isConfirmed = !!lead.confirmedWa;

                      return (
                        <tr key={lead.id} className="border-b align-top">
                          <td className="px-3 py-3">
                            <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                              {lead.businessName}
                            </Link>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs">{lead.phone}</td>
                          <td className="px-3 py-3">
                            {isConfirmed ? (
                              <Badge variant="default" className="bg-green-600 text-[10px]">{t.whatsappOutreach.confirmedWaBadge}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">{t.whatsappOutreach.mobileBadge}</Badge>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {lead.services.map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px]">
                                  {t.serviceCategoryLabels[s] || serviceCategoryLabels[s] || s}
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
                          <td className="px-3 py-3">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-green-600 px-3 text-xs font-medium text-white shadow hover:bg-green-700"
                            >
                              <WhatsAppIcon />
                              {t.whatsappOutreach.openWhatsApp}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filtered.map((lead) => {
                  const message = selectedTemplate
                    ? fillTemplate(selectedTemplate.body, {
                        businessName: lead.businessName,
                        borough: lead.boroughs[0] || undefined,
                        service: lead.services[0]
                          ? t.serviceCategoryLabels[lead.services[0]] || serviceCategoryLabels[lead.services[0]] || lead.services[0]
                          : undefined,
                      })
                    : "";
                  const waLink = lead.confirmedWa
                    ? (lead.confirmedWa.startsWith("http")
                        ? lead.confirmedWa
                        : `https://wa.me/${normalisePhone(lead.confirmedWa)}?text=${encodeURIComponent(message)}`)
                    : buildWaLink(lead.phone, message);
                  const isConfirmed = !!lead.confirmedWa;

                  return (
                    <div key={lead.id} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                            {lead.businessName}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono">{lead.phone}</span>
                            {isConfirmed ? (
                              <Badge variant="default" className="bg-green-600 text-[10px]">{t.whatsappOutreach.confirmedWaBadge}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">{t.whatsappOutreach.mobileBadge}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={statusBadgeVariant[lead.status] ?? "secondary"}>
                          {t.statusLabels[lead.status] || lead.status}
                        </Badge>
                      </div>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-green-600 px-4 text-sm font-medium text-white shadow hover:bg-green-700"
                      >
                        <WhatsAppIcon />
                        {t.whatsappOutreach.openWhatsApp}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>{t.whatsappOutreach.helpText}</p>
          </div>
        </CardContent>
      </Card>

      {/* Back link */}
      <div>
        <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          &larr; {t.whatsappOutreach.backToLeads}
        </Link>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
