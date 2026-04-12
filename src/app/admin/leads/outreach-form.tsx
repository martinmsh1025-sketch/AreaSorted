"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  OUTREACH_CHANNELS,
  OUTREACH_OUTCOMES,
} from "./constants";
import {
  OUTREACH_TEMPLATES,
  fillTemplate,
  getTemplatesForChannel,
  type OutreachTemplate,
} from "@/lib/leads/outreach-templates";
import { useT } from "@/lib/i18n/context";

type Props = {
  leadId: string;
  businessName: string;
  boroughs: string[];
  services: string[];
  logOutreachAction: (formData: FormData) => Promise<void>;
};

const serviceCategoryLabels: Record<string, string> = {
  CLEANING: "cleaning",
  PEST_CONTROL: "pest control",
  HANDYMAN: "handyman",
  FURNITURE_ASSEMBLY: "furniture assembly",
  WASTE_REMOVAL: "waste removal",
  GARDEN_MAINTENANCE: "garden maintenance",
};

function boroughLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function OutreachForm({ leadId, businessName, boroughs, services, logOutreachAction }: Props) {
  const t = useT();
  const [channel, setChannel] = useState<string>("EMAIL");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const templates = getTemplatesForChannel(channel);

  // Template variables from lead data
  const templateVars = {
    businessName,
    borough: boroughs.length > 0 ? boroughLabel(boroughs[0]) : undefined,
    service: services.length > 0 ? (serviceCategoryLabels[services[0]] || services[0]) : undefined,
  };

  useEffect(() => {
    if (selectedTemplateId) {
      const tpl = OUTREACH_TEMPLATES.find((t) => t.id === selectedTemplateId);
      if (tpl) {
        setMessageText(fillTemplate(tpl.body, templateVars));
        if (tpl.subject) {
          setSubject(fillTemplate(tpl.subject, templateVars));
        } else {
          setSubject("");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId]);

  // Reset template selection when channel changes
  useEffect(() => {
    setSelectedTemplateId("");
    setMessageText("");
    setSubject("");
    setShowPreview(false);
  }, [channel]);

  return (
    <form action={logOutreachAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.outreachForm.channel}</label>
          <select
            name="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {OUTREACH_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>{t.channelLabels[ch] || ch}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.outreachForm.outcome}</label>
          <select
            name="outcome"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {OUTREACH_OUTCOMES.map((o) => (
              <option key={o} value={o}>{t.outcomeLabels[o] || o}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Template selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t.outreachForm.messageTemplate}</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">{t.outreachForm.noTemplate}</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name} (Day {tpl.cadenceDay})
            </option>
          ))}
        </select>
        {templates.length === 0 && (
          <p className="mt-1 text-[10px] text-muted-foreground">{t.outreachForm.noTemplatesForChannel}</p>
        )}
      </div>

      {/* Subject line (email only) */}
      {channel === "EMAIL" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t.outreachForm.subjectLine}</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t.outreachForm.subjectPlaceholder}
          />
        </div>
      )}

      {/* Template ID for logging */}
      <input type="hidden" name="messageVariant" value={selectedTemplateId || "custom"} />

      {/* Message preview / editor */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            {channel === "PHONE" ? t.outreachForm.callScript : t.outreachForm.message}
          </label>
          {messageText && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] text-primary hover:underline"
            >
              {showPreview ? t.common.edit : t.common.preview}
            </button>
          )}
        </div>
        {showPreview ? (
          <div className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
            {channel === "EMAIL" && subject && (
              <div className="mb-2 border-b pb-2">
                <span className="text-xs font-medium text-muted-foreground">Subject: </span>
                <span className="text-sm">{subject}</span>
              </div>
            )}
            {messageText}
          </div>
        ) : (
          <textarea
            name="notes"
            rows={channel === "PHONE" ? 8 : 5}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            placeholder={
              channel === "PHONE"
                ? t.outreachForm.phoneScriptPlaceholder
                : t.outreachForm.messagePlaceholder
            }
          />
        )}
      </div>

      {/* Cadence reminder */}
      {selectedTemplateId && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          {t.outreachForm.cadenceReminder}
        </div>
      )}

      <button
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
        type="submit"
      >
        {t.outreachForm.logOutreach}
      </button>
    </form>
  );
}
