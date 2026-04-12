"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  discoverProviders,
  importDiscoveredLeads,
  type DiscoveryResult,
  type DiscoveredLead,
} from "@/lib/leads/discovery";
import type { LeadServiceCategory } from "@prisma/client";

// ---------------------------------------------------------------------------
// Discover leads from Google Places API
// ---------------------------------------------------------------------------

export async function discoverLeadsAction(
  boroughSlug: string,
  service: LeadServiceCategory,
): Promise<{ ok: true; result: DiscoveryResult } | { ok: false; error: string }> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) return { ok: false, error: "Not authenticated" };

  try {
    const result = await discoverProviders(boroughSlug, service);
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Discovery failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Import selected discovered leads
// ---------------------------------------------------------------------------

export async function importDiscoveredLeadsAction(
  leads: Array<{
    businessName: string;
    address: string;
    phone: string | null;
    website: string | null;
    googleMapsUrl: string | null;
    rating: number | null;
    reviewCount: number | null;
    placeId: string;
    borough: string;
    service: LeadServiceCategory;
  }>,
): Promise<{ ok: true; imported: number; skipped: number } | { ok: false; error: string }> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) return { ok: false, error: "Not authenticated" };

  try {
    const result = await importDiscoveredLeads(leads);
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
