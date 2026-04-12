"use server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db/prisma";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { fillTemplate, OUTREACH_TEMPLATES } from "@/lib/leads/outreach-templates";
import { serviceCategoryLabels } from "../constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchEmailResult = {
  ok: boolean;
  message: string;
  totalAttempted: number;
  totalSent: number;
  totalFailed: number;
  errors: string[];
};

export type LeadEmailData = {
  id: string;
  businessName: string;
  services: string[];
  boroughs: string[];
  website: string | null;
  status: string;
  score: number;
  email: string;
};

// ---------------------------------------------------------------------------
// Get leads with email contacts
// ---------------------------------------------------------------------------

export async function getLeadsWithEmailAction(): Promise<LeadEmailData[]> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) return [];

  const prisma = getPrisma();
  const leads = await prisma.providerLead.findMany({
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
    include: {
      contacts: {
        where: {
          channel: "EMAIL",
          NOT: [
            { value: { startsWith: "no-email-found@" } },
            { value: { startsWith: "scrape-failed@" } },
            { value: { contains: "@placeholder" } },
          ],
        },
        take: 1,
        orderBy: { isPrimary: "desc" },
      },
    },
    orderBy: { score: "desc" },
  });

  return leads.map((l) => ({
    id: l.id,
    businessName: l.businessName,
    services: l.services as string[],
    boroughs: l.boroughs,
    website: l.website,
    status: l.status,
    score: l.score,
    email: l.contacts[0]?.value || "",
  }));
}

// ---------------------------------------------------------------------------
// Send batch emails
// ---------------------------------------------------------------------------

export async function sendBatchEmailAction(input: {
  templateId: string;
  leadIds: string[];
}): Promise<BatchEmailResult> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return { ok: false, message: "Not authenticated", totalAttempted: 0, totalSent: 0, totalFailed: 0, errors: [] };
  }

  const template = OUTREACH_TEMPLATES.find((t) => t.id === input.templateId);
  if (!template || template.channel !== "EMAIL") {
    return { ok: false, message: "Invalid email template", totalAttempted: 0, totalSent: 0, totalFailed: 0, errors: [] };
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      message: "RESEND_API_KEY not configured. Set it in .env.local to enable email sending.",
      totalAttempted: 0,
      totalSent: 0,
      totalFailed: 0,
      errors: ["Missing RESEND_API_KEY"],
    };
  }

  const prisma = getPrisma();

  // Fetch the leads with their email contacts
  const leads = await prisma.providerLead.findMany({
    where: { id: { in: input.leadIds } },
    include: {
      contacts: {
        where: {
          channel: "EMAIL",
          NOT: [
            { value: { startsWith: "no-email-found@" } },
            { value: { startsWith: "scrape-failed@" } },
            { value: { contains: "@placeholder" } },
          ],
        },
        take: 1,
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  let totalSent = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    const email = lead.contacts[0]?.value;
    if (!email) {
      totalFailed++;
      errors.push(`${lead.businessName}: No email address`);
      continue;
    }

    const serviceLabel = lead.services[0]
      ? serviceCategoryLabels[lead.services[0]] || lead.services[0]
      : undefined;

    const subject = template.subject
      ? fillTemplate(template.subject, {
          businessName: lead.businessName,
          borough: lead.boroughs[0] || undefined,
          service: serviceLabel,
        })
      : `AreaSorted — More jobs in your area`;

    const body = fillTemplate(template.body, {
      businessName: lead.businessName,
      borough: lead.boroughs[0] || undefined,
      service: serviceLabel,
      website: lead.website || undefined,
    });

    try {
      const result = await sendTransactionalEmail({
        to: email,
        subject,
        text: body,
      });

      if (result.sent) {
        totalSent++;

        // Log outreach record
        await prisma.leadOutreach.create({
          data: {
            leadId: lead.id,
            channel: "EMAIL",
            outcome: "SENT",
            messageVariant: template.name,
            notes: `Batch email sent to ${email}`,
          },
        });

        // Auto-update status from NEW to CONTACTED
        if (lead.status === "NEW") {
          await prisma.providerLead.update({
            where: { id: lead.id },
            data: { status: "CONTACTED" },
          });
        }
      } else {
        totalFailed++;
        errors.push(`${lead.businessName}: Send failed (${result.reason || "unknown"})`);

        // Still log the attempt
        await prisma.leadOutreach.create({
          data: {
            leadId: lead.id,
            channel: "EMAIL",
            outcome: "BOUNCED",
            messageVariant: template.name,
            notes: `Send failed: ${result.reason || "unknown"}`,
          },
        });
      }
    } catch (error) {
      totalFailed++;
      errors.push(`${lead.businessName}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Small delay between sends to respect rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return {
    ok: true,
    message: `Sent ${totalSent} emails, ${totalFailed} failed out of ${leads.length} leads`,
    totalAttempted: leads.length,
    totalSent,
    totalFailed,
    errors,
  };
}
