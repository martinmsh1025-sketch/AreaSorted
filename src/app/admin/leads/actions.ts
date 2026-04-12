"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db/prisma";
import type {
  LeadServiceCategory,
  LeadType,
  LeadStatus,
  LeadSource,
  OutreachChannel,
  OutreachOutcome,
} from "@prisma/client";
import {
  LEAD_SERVICE_CATEGORIES,
  LEAD_STATUSES,
  OUTREACH_CHANNELS,
  OUTREACH_OUTCOMES,
} from "./constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function str(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

function strOrNull(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v || null;
}

function parseServices(raw: string): LeadServiceCategory[] {
  return raw
    .split(",")
    .map((s) => s.trim() as LeadServiceCategory)
    .filter((s) => LEAD_SERVICE_CATEGORIES.includes(s));
}

function parseBoroughs(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Create / Update Lead
// ---------------------------------------------------------------------------

export async function createLeadAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const businessName = str(formData, "businessName");
  if (!businessName) redirect("/admin/leads?error=business_name_required");

  const prisma = getPrisma();
  const lead = await prisma.providerLead.create({
    data: {
      businessName,
      leadType: (str(formData, "leadType") || "UNKNOWN") as LeadType,
      services: parseServices(str(formData, "services")),
      boroughs: parseBoroughs(str(formData, "boroughs")),
      website: strOrNull(formData, "website"),
      sourceUrl: strOrNull(formData, "sourceUrl"),
      source: (str(formData, "source") || "MANUAL") as LeadSource,
      score: Math.min(100, Math.max(0, parseInt(str(formData, "score") || "0", 10) || 0)),
      status: "NEW",
      notes: strOrNull(formData, "notes"),
      tags: parseTags(str(formData, "tags")),
    },
  });

  redirect(`/admin/leads/${lead.id}?status=created`);
}

export async function updateLeadAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const id = str(formData, "id");
  if (!id) redirect("/admin/leads?error=missing_id");

  const prisma = getPrisma();
  await prisma.providerLead.update({
    where: { id },
    data: {
      businessName: str(formData, "businessName") || undefined,
      leadType: (str(formData, "leadType") || undefined) as LeadType | undefined,
      services: parseServices(str(formData, "services")),
      boroughs: parseBoroughs(str(formData, "boroughs")),
      website: strOrNull(formData, "website"),
      sourceUrl: strOrNull(formData, "sourceUrl"),
      source: (str(formData, "source") || undefined) as LeadSource | undefined,
      score: Math.min(100, Math.max(0, parseInt(str(formData, "score") || "0", 10) || 0)),
      status: (str(formData, "status") || undefined) as LeadStatus | undefined,
      notes: strOrNull(formData, "notes"),
      tags: parseTags(str(formData, "tags")),
    },
  });

  redirect(`/admin/leads/${id}?status=updated`);
}

export async function updateLeadStatusAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const id = str(formData, "id");
  const status = str(formData, "status") as LeadStatus;
  if (!id || !LEAD_STATUSES.includes(status)) redirect("/admin/leads?error=invalid_status");

  const prisma = getPrisma();
  await prisma.providerLead.update({
    where: { id },
    data: { status },
  });

  revalidatePath(`/admin/leads/${id}`);
  redirect(`/admin/leads/${id}?status=status_updated`);
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export async function addLeadContactAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const leadId = str(formData, "leadId");
  const channel = str(formData, "channel") as OutreachChannel;
  const value = str(formData, "value");
  if (!leadId || !value || !OUTREACH_CHANNELS.includes(channel)) {
    redirect(`/admin/leads/${leadId}?error=invalid_contact`);
  }

  const prisma = getPrisma();
  await prisma.leadContact.create({
    data: {
      leadId,
      channel,
      value,
      publicSource: strOrNull(formData, "publicSource"),
      isPrimary: str(formData, "isPrimary") === "true",
    },
  });

  redirect(`/admin/leads/${leadId}?status=contact_added`);
}

export async function deleteLeadContactAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const contactId = str(formData, "contactId");
  const leadId = str(formData, "leadId");
  if (!contactId) redirect(`/admin/leads/${leadId}?error=missing_contact_id`);

  const prisma = getPrisma();
  await prisma.leadContact.delete({ where: { id: contactId } });

  redirect(`/admin/leads/${leadId}?status=contact_deleted`);
}

// ---------------------------------------------------------------------------
// Outreach
// ---------------------------------------------------------------------------

export async function logOutreachAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const leadId = str(formData, "leadId");
  const channel = str(formData, "channel") as OutreachChannel;
  const outcome = (str(formData, "outcome") || "SENT") as OutreachOutcome;
  if (!leadId || !OUTREACH_CHANNELS.includes(channel)) {
    redirect(`/admin/leads/${leadId}?error=invalid_outreach`);
  }

  const prisma = getPrisma();
  await prisma.leadOutreach.create({
    data: {
      leadId,
      channel,
      outcome,
      messageVariant: strOrNull(formData, "messageVariant"),
      notes: strOrNull(formData, "notes"),
    },
  });

  // Auto-update lead status to CONTACTED if still NEW
  const lead = await prisma.providerLead.findUnique({ where: { id: leadId }, select: { status: true } });
  if (lead?.status === "NEW") {
    await prisma.providerLead.update({ where: { id: leadId }, data: { status: "CONTACTED" } });
  }

  redirect(`/admin/leads/${leadId}?status=outreach_logged`);
}

export async function updateOutreachOutcomeAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const outreachId = str(formData, "outreachId");
  const leadId = str(formData, "leadId");
  const outcome = str(formData, "outcome") as OutreachOutcome;
  if (!outreachId || !OUTREACH_OUTCOMES.includes(outcome)) {
    redirect(`/admin/leads/${leadId}?error=invalid_outcome`);
  }

  const prisma = getPrisma();
  await prisma.leadOutreach.update({
    where: { id: outreachId },
    data: {
      outcome,
      replyAt: ["REPLIED", "POSITIVE", "NEGATIVE"].includes(outcome) ? new Date() : undefined,
    },
  });

  redirect(`/admin/leads/${leadId}?status=outcome_updated`);
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function addLeadNoteAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const leadId = str(formData, "leadId");
  const content = str(formData, "content");
  if (!leadId || !content) redirect(`/admin/leads/${leadId}?error=empty_note`);

  const prisma = getPrisma();
  await prisma.leadNote.create({ data: { leadId, content } });

  redirect(`/admin/leads/${leadId}?status=note_added`);
}

// ---------------------------------------------------------------------------
// CSV Import
// ---------------------------------------------------------------------------

export async function importLeadsCsvAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const csvText = str(formData, "csvText");
  if (!csvText) redirect("/admin/leads?error=empty_csv");

  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) redirect("/admin/leads?error=csv_too_short");

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("business_name");
  if (nameIdx === -1) redirect("/admin/leads?error=csv_missing_business_name_column");

  const typeIdx = header.indexOf("lead_type");
  const servicesIdx = header.indexOf("services");
  const boroughsIdx = header.indexOf("boroughs");
  const websiteIdx = header.indexOf("website");
  const sourceIdx = header.indexOf("source");
  const sourceUrlIdx = header.indexOf("source_url");
  const emailIdx = header.indexOf("email");
  const phoneIdx = header.indexOf("phone");
  const whatsappIdx = header.indexOf("whatsapp");
  const notesIdx = header.indexOf("notes");

  const prisma = getPrisma();
  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const businessName = cols[nameIdx];
    if (!businessName) {
      skipped++;
      continue;
    }

    // Deduplicate by business name (case-insensitive)
    const existing = await prisma.providerLead.findFirst({
      where: { businessName: { equals: businessName, mode: "insensitive" } },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const lead = await prisma.providerLead.create({
      data: {
        businessName,
        leadType: typeIdx >= 0 ? ((cols[typeIdx]?.toUpperCase() || "UNKNOWN") as LeadType) : "UNKNOWN",
        services: servicesIdx >= 0 ? parseServices(cols[servicesIdx] || "") : [],
        boroughs: boroughsIdx >= 0 ? parseBoroughs(cols[boroughsIdx] || "") : [],
        website: websiteIdx >= 0 ? cols[websiteIdx] || null : null,
        source: "CSV_IMPORT",
        sourceUrl: sourceUrlIdx >= 0 ? cols[sourceUrlIdx] || null : null,
        notes: notesIdx >= 0 ? cols[notesIdx] || null : null,
      },
    });

    // Auto-create contacts from email/phone/whatsapp columns
    const contactsToCreate: Array<{ channel: OutreachChannel; value: string }> = [];
    if (emailIdx >= 0 && cols[emailIdx]) contactsToCreate.push({ channel: "EMAIL", value: cols[emailIdx] });
    if (phoneIdx >= 0 && cols[phoneIdx]) contactsToCreate.push({ channel: "PHONE", value: cols[phoneIdx] });
    if (whatsappIdx >= 0 && cols[whatsappIdx]) contactsToCreate.push({ channel: "WHATSAPP", value: cols[whatsappIdx] });

    for (const contact of contactsToCreate) {
      await prisma.leadContact.create({
        data: {
          leadId: lead.id,
          channel: contact.channel,
          value: contact.value,
          publicSource: "CSV import",
          isPrimary: contact.channel === "EMAIL",
        },
      });
    }

    imported++;
  }

  redirect(`/admin/leads?status=imported_${imported}_skipped_${skipped}`);
}

// ---------------------------------------------------------------------------
// Delete Lead
// ---------------------------------------------------------------------------

export async function deleteLeadAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const id = str(formData, "id");
  if (!id) redirect("/admin/leads?error=missing_id");

  const prisma = getPrisma();
  await prisma.providerLead.delete({ where: { id } });

  redirect("/admin/leads?status=lead_deleted");
}
