import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db/prisma";
import type { LeadServiceCategory } from "@prisma/client";

// ---------------------------------------------------------------------------
// GET /api/admin/leads/export?leadStatus=...&service=...&source=...&contact=...&q=...
// Returns a CSV file of filtered leads with their contacts.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("leadStatus") || "all";
  const serviceFilter = searchParams.get("service") || "all";
  const sourceFilter = searchParams.get("source") || "all";
  const contactFilter = searchParams.get("contact") || "all";
  const boroughFilter = searchParams.get("borough") || "all";
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  const prisma = getPrisma();
  const allLeads = await prisma.providerLead.findMany({
    include: { contacts: true },
    orderBy: { createdAt: "desc" },
  });

  // Apply same filters as the page
  const filteredLeads = allLeads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (serviceFilter !== "all" && !lead.services.includes(serviceFilter as LeadServiceCategory)) return false;
    if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
    if (boroughFilter !== "all" && !lead.boroughs.includes(boroughFilter)) return false;

    // Contact type filters
    if (contactFilter !== "all") {
      const realContacts = lead.contacts.filter(
        (c) =>
          !c.value.startsWith("no-email-found@") &&
          !c.value.startsWith("scrape-failed@") &&
          !c.value.includes("@placeholder"),
      );
      if (contactFilter === "email") {
        if (!realContacts.some((c) => c.channel === "EMAIL")) return false;
      } else if (contactFilter === "phone") {
        if (!realContacts.some((c) => c.channel === "PHONE")) return false;
      } else if (contactFilter === "whatsapp") {
        if (!realContacts.some((c) => c.channel === "WHATSAPP")) return false;
      } else if (contactFilter === "any") {
        if (realContacts.length === 0) return false;
      } else if (contactFilter === "none") {
        if (realContacts.length > 0) return false;
      }
    }

    if (query) {
      const searchable = [lead.businessName, lead.website, lead.notes, ...lead.boroughs]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });

  // Build CSV
  const headers = [
    "business_name",
    "status",
    "services",
    "boroughs",
    "website",
    "source",
    "score",
    "email",
    "phone",
    "whatsapp",
    "facebook",
    "instagram",
    "linkedin",
    "notes",
    "created_at",
  ];

  const rows = filteredLeads.map((lead) => {
    const realContacts = lead.contacts.filter(
      (c) =>
        !c.value.startsWith("no-email-found@") &&
        !c.value.startsWith("scrape-failed@") &&
        !c.value.includes("@placeholder"),
    );

    const emails = realContacts
      .filter((c) => c.channel === "EMAIL")
      .map((c) => c.value)
      .join("; ");
    const phones = realContacts
      .filter((c) => c.channel === "PHONE")
      .map((c) => c.value)
      .join("; ");
    const whatsapps = realContacts
      .filter((c) => c.channel === "WHATSAPP")
      .map((c) => c.value)
      .join("; ");
    const facebooks = realContacts
      .filter((c) => c.channel === "FACEBOOK_DM")
      .map((c) => c.value)
      .join("; ");
    const instagrams = realContacts
      .filter((c) => c.channel === "INSTAGRAM_DM")
      .map((c) => c.value)
      .join("; ");
    const linkedins = realContacts
      .filter((c) => c.channel === "LINKEDIN_DM")
      .map((c) => c.value)
      .join("; ");

    return [
      csvEscape(lead.businessName),
      lead.status,
      lead.services.join("; "),
      lead.boroughs.join("; "),
      lead.website || "",
      lead.source,
      String(lead.score),
      csvEscape(emails),
      csvEscape(phones),
      csvEscape(whatsapps),
      csvEscape(facebooks),
      csvEscape(instagrams),
      csvEscape(linkedins),
      csvEscape(lead.notes || ""),
      lead.createdAt.toISOString().split("T")[0],
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-export-${date}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
