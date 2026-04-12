"use server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  discoverTrustpilotProviders,
  importTrustpilotLeads,
  type TrustpilotDiscoveryResult,
} from "@/lib/leads/trustpilot-scraper";
import type { LeadServiceCategory } from "@prisma/client";

// ---------------------------------------------------------------------------
// Discover leads from Trustpilot
// ---------------------------------------------------------------------------

export async function discoverTrustpilotAction(
  service: LeadServiceCategory,
  maxPages?: number,
): Promise<{ ok: true; result: TrustpilotDiscoveryResult } | { ok: false; error: string }> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) return { ok: false, error: "Not authenticated" };

  try {
    const result = await discoverTrustpilotProviders(service, maxPages);
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Trustpilot discovery failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Import selected Trustpilot leads
// ---------------------------------------------------------------------------

export async function importTrustpilotLeadsAction(
  leads: Array<{
    businessName: string;
    website: string | null;
    email: string | null;
    phone: string | null;
    trustpilotUrl: string;
    trustScore: number | null;
    reviewCount: number | null;
    service: LeadServiceCategory;
  }>,
): Promise<{ ok: true; imported: number; skipped: number } | { ok: false; error: string }> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) return { ok: false, error: "Not authenticated" };

  try {
    const result = await importTrustpilotLeads(leads);
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Batch discover across all services
// ---------------------------------------------------------------------------

export async function batchDiscoverTrustpilotAction(
  service: LeadServiceCategory,
  maxPages?: number,
): Promise<{
  ok: true;
  result: TrustpilotDiscoveryResult;
} | {
  ok: false;
  error: string;
}> {
  // Same as single discovery — the batch UI will call this per-service
  return discoverTrustpilotAction(service, maxPages);
}
