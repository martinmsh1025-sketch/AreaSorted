import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db/prisma";
import { WhatsAppOutreach } from "./whatsapp-outreach";

/**
 * Check if a phone number is a UK mobile (07...) as opposed to a landline (020/01/03).
 * Only mobiles are likely to have WhatsApp.
 */
function isMobileNumber(phone: string): boolean {
  const digits = phone.replace(/[\s\-\.\(\)]/g, "");
  // +447x / 447x / 07x  — UK mobile
  if (/^(\+?44\s*7|07)\d/.test(digits)) return true;
  return false;
}

export default async function WhatsAppPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();

  // Fetch leads with confirmed WhatsApp contacts (wa.me links found by scraper)
  // AND leads with mobile phone numbers (07...) — potential WhatsApp
  const leads = await prisma.providerLead.findMany({
    where: {
      OR: [
        { contacts: { some: { channel: "WHATSAPP" } } },
        { contacts: { some: { channel: "PHONE" } } },
      ],
    },
    include: {
      contacts: {
        where: { channel: { in: ["WHATSAPP", "PHONE"] } },
      },
    },
    orderBy: { score: "desc" },
  });

  // Transform: separate confirmed WhatsApp from mobile phones, skip landlines
  const serialised = leads
    .map((l) => {
      const waContact = l.contacts.find((c) => c.channel === "WHATSAPP");
      const phoneContacts = l.contacts.filter((c) => c.channel === "PHONE");
      const mobilePhone = phoneContacts.find((c) => isMobileNumber(c.value));
      const anyPhone = phoneContacts[0];

      // Confirmed WhatsApp link from scraper
      const confirmedWa = waContact?.value || null;
      // Mobile phone (potential WhatsApp)
      const mobile = mobilePhone?.value || null;
      // Best phone for display (mobile preferred, then any)
      const displayPhone = mobile || anyPhone?.value || null;

      // Skip leads that only have landlines and no WhatsApp
      if (!confirmedWa && !mobile) return null;

      return {
        id: l.id,
        businessName: l.businessName,
        services: l.services as string[],
        boroughs: l.boroughs,
        website: l.website,
        status: l.status,
        score: l.score,
        phone: displayPhone || "",
        confirmedWa,
        mobile,
      };
    })
    .filter(Boolean) as Array<{
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
    }>;

  return <WhatsAppOutreach leads={serialised} />;
}
