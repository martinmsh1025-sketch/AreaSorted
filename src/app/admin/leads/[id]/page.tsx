import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  updateLeadAction,
  updateLeadStatusAction,
  addLeadContactAction,
  deleteLeadContactAction,
  logOutreachAction,
  updateOutreachOutcomeAction,
  addLeadNoteAction,
  deleteLeadAction,
} from "../actions";
import { OutreachForm } from "../outreach-form";
import {
  LEAD_SERVICE_CATEGORIES,
  LEAD_STATUSES,
  LEAD_SOURCES,
  OUTREACH_CHANNELS,
  OUTREACH_OUTCOMES,
  statusBadgeVariant,
  outcomeBadgeVariant,
} from "../constants";
import { getAdminTranslations } from "@/lib/i18n/server";

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLeadDetailPage({ params, searchParams }: LeadDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const t = await getAdminTranslations();
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : "";
  const statusMsg = typeof sp.status === "string" ? sp.status : "";

  const prisma = getPrisma();
  const lead = await prisma.providerLead.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      outreach: { orderBy: { sentAt: "desc" } },
      detailedNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground">&larr; {t.leadDetail.allLeads}</Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leadDetail.title}</p>
              <CardTitle className="mt-1 text-xl">{lead.businessName}</CardTitle>
              <CardDescription>
                {lead.leadType === "SOLE_TRADER" ? t.leads.soleTrader : lead.leadType === "COMPANY" ? t.leads.company : t.leads.unknownType}
                {" | "}{t.leadDetail.scoreLabel} {lead.score}/100
                {" | "}{t.leadDetail.sourceLabel} {t.sourceLabels[lead.source] || lead.source}
                {lead.sourceUrl && (
                  <> | <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{lead.sourceUrl}</a></>
                )}
              </CardDescription>
            </div>
            <Badge variant={statusBadgeVariant[lead.status] ?? "secondary"}>
              {t.statusLabels[lead.status] || lead.status}
            </Badge>
          </div>
        </CardHeader>
        {(error || statusMsg) && (
          <CardContent>
            {error && <p className="text-sm text-destructive">{error.replace(/_/g, " ")}</p>}
            {statusMsg && <p className="text-sm text-green-600">{statusMsg.replace(/_/g, " ")}</p>}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Quick status change */}
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leadDetail.statusSection}</p>
              <CardDescription>{t.leadDetail.statusDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateLeadStatusAction} className="flex gap-2 flex-wrap">
                <input type="hidden" name="id" value={lead.id} />
                <select
                  name="status"
                  defaultValue={lead.status}
                  className="flex h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{t.statusLabels[s] || s}</option>
                  ))}
                </select>
                <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
                  {t.leadDetail.updateStatus}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Edit lead */}
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leadDetail.editLead}</p>
              <CardDescription>{t.leadDetail.editDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateLeadAction} className="space-y-3">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="status" value={lead.status} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.businessName}</label>
                    <Input name="businessName" defaultValue={lead.businessName} required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.website}</label>
                    <Input name="website" defaultValue={lead.website || ""} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.leadType}</label>
                    <select
                      name="leadType"
                      defaultValue={lead.leadType}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="UNKNOWN">{t.leads.unknown}</option>
                      <option value="COMPANY">{t.leads.company}</option>
                      <option value="SOLE_TRADER">{t.leads.soleTrader}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.sourceField}</label>
                    <select
                      name="source"
                      defaultValue={lead.source}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      {LEAD_SOURCES.map((s) => (
                        <option key={s} value={s}>{t.sourceLabels[s] || s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.sourceUrl}</label>
                    <Input name="sourceUrl" defaultValue={lead.sourceUrl || ""} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.scoreField}</label>
                    <Input name="score" type="number" min={0} max={100} defaultValue={lead.score} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.servicesField}</label>
                    <Input name="services" defaultValue={lead.services.join(", ")} placeholder={t.leadDetail.servicesPlaceholder} />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t.leadDetail.servicesValid}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.boroughsField}</label>
                    <Input name="boroughs" defaultValue={lead.boroughs.join(", ")} placeholder={t.leadDetail.boroughsPlaceholder} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.tagsField}</label>
                    <Input name="tags" defaultValue={lead.tags.join(", ")} placeholder={t.leadDetail.tagsPlaceholder} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t.leadDetail.notesField}</label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={lead.notes || ""}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  />
                </div>
                <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
                  {t.leadDetail.saveChanges}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leadDetail.contactsSection}</p>
              <CardDescription>{t.leadDetail.contactsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.contacts.length > 0 ? (
                <div className="space-y-2">
                  {lead.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{t.channelLabels[contact.channel] || contact.channel}</Badge>
                          {contact.isPrimary && <Badge variant="default" className="text-[10px]">{t.leadDetail.primary}</Badge>}
                          {contact.verified && <Badge variant="default" className="text-[10px]">{t.leadDetail.verified}</Badge>}
                        </div>
                        <p className="text-sm font-mono">{contact.value}</p>
                        {contact.publicSource && (
                          <p className="text-xs text-muted-foreground">{t.leadDetail.contactSource} {contact.publicSource}</p>
                        )}
                      </div>
                      <form action={deleteLeadContactAction}>
                        <input type="hidden" name="contactId" value={contact.id} />
                        <input type="hidden" name="leadId" value={lead.id} />
                        <button type="submit" className="text-xs text-destructive hover:underline">{t.leadDetail.remove}</button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.leadDetail.noContacts}</p>
              )}

              <form action={addLeadContactAction} className="grid gap-2 sm:grid-cols-[140px_1fr_1fr_auto]">
                <input type="hidden" name="leadId" value={lead.id} />
                <select
                  name="channel"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {OUTREACH_CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{t.channelLabels[ch] || ch}</option>
                  ))}
                </select>
                <Input name="value" placeholder={t.leadDetail.contactValuePlaceholder} required />
                <Input name="publicSource" placeholder={t.leadDetail.contactSourcePlaceholder} />
                <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
                  {t.common.add}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Delete */}
          <Card className="border-destructive/50">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive">{t.leadDetail.dangerZone}</p>
            </CardHeader>
            <CardContent>
              <form action={deleteLeadAction}>
                <input type="hidden" name="id" value={lead.id} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-white shadow hover:bg-destructive/90"
                >
                  {t.leadDetail.deleteLead}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Log outreach */}
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leadDetail.logOutreach}</p>
              <CardDescription>{t.leadDetail.logOutreachDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <OutreachForm
                leadId={lead.id}
                businessName={lead.businessName}
                boroughs={lead.boroughs}
                services={lead.services}
                logOutreachAction={logOutreachAction}
              />
            </CardContent>
          </Card>

          {/* Outreach timeline */}
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leadDetail.outreachTimeline}</p>
              <CardDescription>{lead.outreach.length} {t.leadDetail.eventsLogged}</CardDescription>
            </CardHeader>
            <CardContent>
              {lead.outreach.length > 0 ? (
                <div className="space-y-3">
                  {lead.outreach.map((event) => (
                    <div key={event.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[10px]">{t.channelLabels[event.channel] || event.channel}</Badge>
                          <Badge variant={outcomeBadgeVariant[event.outcome] ?? "secondary"} className="text-[10px]">
                            {t.outcomeLabels[event.outcome] || event.outcome}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {event.sentAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {event.messageVariant && (
                        <p className="text-xs text-muted-foreground">{t.leadDetail.template} {event.messageVariant}</p>
                      )}
                      {event.notes && (
                        <p className="text-sm">{event.notes}</p>
                      )}
                      {event.replyAt && (
                        <p className="text-xs text-green-600">
                          {t.leadDetail.replied} {event.replyAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {/* Update outcome */}
                      <form action={updateOutreachOutcomeAction} className="flex gap-2 items-center">
                        <input type="hidden" name="outreachId" value={event.id} />
                        <input type="hidden" name="leadId" value={lead.id} />
                        <select
                          name="outcome"
                          defaultValue={event.outcome}
                          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-0.5 text-xs shadow-sm"
                        >
                          {OUTREACH_OUTCOMES.map((o) => (
                            <option key={o} value={o}>{t.outcomeLabels[o] || o}</option>
                          ))}
                        </select>
                        <button type="submit" className="text-xs text-primary hover:underline">{t.leadDetail.update}</button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.leadDetail.noOutreach}</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leadDetail.notesSection}</p>
              <CardDescription>{t.leadDetail.notesDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.detailedNotes.length > 0 && (
                <div className="space-y-2">
                  {lead.detailedNotes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-3">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {note.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form action={addLeadNoteAction} className="space-y-2">
                <input type="hidden" name="leadId" value={lead.id} />
                <textarea
                  name="content"
                  rows={3}
                  required
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  placeholder={t.leadDetail.addNotePlaceholder}
                />
                <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90" type="submit">
                  {t.leadDetail.addNote}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
