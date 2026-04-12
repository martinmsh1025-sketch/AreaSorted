"use server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db/prisma";
import { boroughPages } from "@/lib/seo/borough-pages";
import { scrapeWebsite } from "@/lib/leads/scraper";
import {
  BOROUGH_COORDINATES,
  SERVICE_SEARCH_QUERIES,
  searchGooglePlaces,
  computeBasicScore,
} from "@/lib/leads/discovery";
import type { LeadServiceCategory, OutreachChannel } from "@prisma/client";
import { LEAD_SERVICE_CATEGORIES } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChunkResult = {
  ok: boolean;
  message: string;
  // Discovery stats
  searchesDone: number;
  placesFound: number;
  leadsImported: number;
  leadsSkipped: number;
  errors: string[];
  // Should we stop? (quota / auth error)
  shouldStop: boolean;
};

export type EnrichChunkResult = {
  ok: boolean;
  message: string;
  leadsProcessed: number;
  leadsEnriched: number;
  contactsAdded: number;
  hasMore: boolean;
};

export type BatchInfo = {
  totalCombos: number;
  totalLeadsToEnrich: number;
};

// ---------------------------------------------------------------------------
// Get batch info (how many combos, how many leads need enrichment)
// ---------------------------------------------------------------------------

export async function getBatchInfoAction(): Promise<BatchInfo> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) return { totalCombos: 0, totalLeadsToEnrich: 0 };

  const combos = buildCombos();

  const prisma = getPrisma();
  const leadsToEnrich = await prisma.providerLead.count({
    where: {
      website: { not: null },
      websiteScraped: false,
    },
  });

  return { totalCombos: combos.length, totalLeadsToEnrich: leadsToEnrich };
}

// ---------------------------------------------------------------------------
// Helper: build all borough x service combos
// ---------------------------------------------------------------------------

function buildCombos(): Array<{ boroughSlug: string; boroughName: string; service: LeadServiceCategory }> {
  const combos: Array<{ boroughSlug: string; boroughName: string; service: LeadServiceCategory }> = [];
  for (const borough of boroughPages) {
    for (const service of LEAD_SERVICE_CATEGORIES) {
      if (BOROUGH_COORDINATES[borough.slug]) {
        combos.push({ boroughSlug: borough.slug, boroughName: borough.name, service });
      }
    }
  }
  return combos;
}

// ---------------------------------------------------------------------------
// Discovery chunk: search a slice of combos (e.g. index 0-9, then 10-19, ...)
// ---------------------------------------------------------------------------

const DISCOVERY_CHUNK_SIZE = 8;

export async function runDiscoveryChunkAction(startIndex: number): Promise<ChunkResult> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return { ok: false, message: "Not authenticated", searchesDone: 0, placesFound: 0, leadsImported: 0, leadsSkipped: 0, errors: [], shouldStop: true };
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "replace-with-google-maps-key") {
    return { ok: false, message: "Google Maps API key not configured", searchesDone: 0, placesFound: 0, leadsImported: 0, leadsSkipped: 0, errors: [], shouldStop: true };
  }

  const combos = buildCombos();
  const end = Math.min(startIndex + DISCOVERY_CHUNK_SIZE, combos.length);
  const chunk = combos.slice(startIndex, end);

  if (chunk.length === 0) {
    return { ok: true, message: "No more combos", searchesDone: 0, placesFound: 0, leadsImported: 0, leadsSkipped: 0, errors: [], shouldStop: false };
  }

  const prisma = getPrisma();
  const errors: string[] = [];
  let placesFound = 0;
  let leadsImported = 0;
  let leadsSkipped = 0;

  // Load existing names for dedup
  const existingLeads = await prisma.providerLead.findMany({
    select: { businessName: true },
  });
  const existingNames = new Set(
    existingLeads.map((l) => l.businessName.toLowerCase().trim()),
  );

  for (const combo of chunk) {
    const center = BOROUGH_COORDINATES[combo.boroughSlug];
    const queries = SERVICE_SEARCH_QUERIES[combo.service];
    const searchTerm = queries[0];
    const query = `${searchTerm} in ${combo.boroughName} London`;

    try {
      const places = await searchGooglePlaces(query, center, apiKey);
      placesFound += places.length;

      for (const place of places) {
        const name = place.displayName?.text;
        if (!name) continue;

        const nameLower = name.toLowerCase().trim();
        if (existingNames.has(nameLower)) {
          leadsSkipped++;
          continue;
        }
        existingNames.add(nameLower);

        const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || null;
        const rating = place.rating ?? null;
        const reviewCount = place.userRatingCount ?? null;

        const created = await prisma.providerLead.create({
          data: {
            businessName: name,
            leadType: "UNKNOWN",
            services: [combo.service],
            boroughs: [combo.boroughSlug],
            website: place.websiteUri || null,
            sourceUrl: place.googleMapsUri || null,
            source: "GOOGLE_MAPS",
            score: computeBasicScore(rating, reviewCount),
            status: "NEW",
            notes: place.formattedAddress || null,
            tags: rating ? [`rating-${rating}`] : [],
          },
        });

        if (phone) {
          await prisma.leadContact.create({
            data: {
              leadId: created.id,
              channel: "PHONE",
              value: phone,
              publicSource: "Google Maps listing",
              isPrimary: true,
            },
          });
        }

        leadsImported++;
      }

      // Small delay between API calls
      await new Promise((r) => setTimeout(r, 150));
    } catch (error) {
      const msg = `${combo.boroughName}/${combo.service}: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(msg);

      // Quota / auth error → tell client to stop
      if (error instanceof Error && (error.message.includes("403") || error.message.includes("429"))) {
        return {
          ok: false,
          message: `API error: ${msg}`,
          searchesDone: chunk.length,
          placesFound,
          leadsImported,
          leadsSkipped,
          errors,
          shouldStop: true,
        };
      }
    }
  }

  return {
    ok: true,
    message: `Searched ${chunk.length} combos (${startIndex + 1}-${end})`,
    searchesDone: chunk.length,
    placesFound,
    leadsImported,
    leadsSkipped,
    errors,
    shouldStop: false,
  };
}

// ---------------------------------------------------------------------------
// Enrichment chunk: scrape a batch of leads that need email contacts
// ---------------------------------------------------------------------------

const ENRICH_CHUNK_SIZE = 10;

export async function runEnrichChunkAction(offset: number): Promise<EnrichChunkResult> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return { ok: false, message: "Not authenticated", leadsProcessed: 0, leadsEnriched: 0, contactsAdded: 0, hasMore: false };
  }

  const prisma = getPrisma();

  const leadsToEnrich = await prisma.providerLead.findMany({
    where: {
      website: { not: null },
      websiteScraped: false,
    },
    select: { id: true, website: true },
    take: ENRICH_CHUNK_SIZE,
    skip: 0, // always take from top since processed ones get websiteScraped=true
  });

  if (leadsToEnrich.length === 0) {
    return { ok: true, message: "No more leads to enrich", leadsProcessed: 0, leadsEnriched: 0, contactsAdded: 0, hasMore: false };
  }

  let leadsEnriched = 0;
  let contactsAdded = 0;

  for (const lead of leadsToEnrich) {
    if (!lead.website) continue;

    try {
      const scraped = await scrapeWebsite(lead.website);

      const contactsToCreate: Array<{
        channel: OutreachChannel;
        value: string;
        publicSource: string;
      }> = [];

      for (const email of scraped.emails) {
        contactsToCreate.push({ channel: "EMAIL", value: email, publicSource: `Scraped from ${lead.website}` });
      }
      for (const phone of scraped.phones) {
        contactsToCreate.push({ channel: "PHONE", value: phone, publicSource: `Scraped from ${lead.website}` });
      }
      for (const wa of scraped.whatsappLinks) {
        contactsToCreate.push({ channel: "WHATSAPP", value: wa, publicSource: `Scraped from ${lead.website}` });
      }
      for (const fb of scraped.facebookLinks) {
        contactsToCreate.push({ channel: "FACEBOOK_DM", value: fb, publicSource: `Scraped from ${lead.website}` });
      }
      for (const ig of scraped.instagramLinks) {
        contactsToCreate.push({ channel: "INSTAGRAM_DM", value: ig, publicSource: `Scraped from ${lead.website}` });
      }
      for (const li of scraped.linkedinLinks) {
        contactsToCreate.push({ channel: "LINKEDIN_DM", value: li, publicSource: `Scraped from ${lead.website}` });
      }

      if (contactsToCreate.length > 0) {
        const existingContacts = await prisma.leadContact.findMany({
          where: { leadId: lead.id },
          select: { channel: true, value: true },
        });
        const existingSet = new Set(
          existingContacts.map((c) => `${c.channel}:${c.value.toLowerCase()}`),
        );

        for (const contact of contactsToCreate) {
          const key = `${contact.channel}:${contact.value.toLowerCase()}`;
          if (existingSet.has(key)) continue;
          existingSet.add(key);

          await prisma.leadContact.create({
            data: {
              leadId: lead.id,
              channel: contact.channel,
              value: contact.value,
              publicSource: contact.publicSource,
              isPrimary: contact.channel === "EMAIL" && !existingContacts.some((c) => c.channel === "EMAIL"),
            },
          });
          contactsAdded++;
        }
        leadsEnriched++;
      }

      // Mark as scraped regardless of whether contacts were found
      await prisma.providerLead.update({
        where: { id: lead.id },
        data: { websiteScraped: true },
      });
    } catch {
      // Scrape failed — still mark as scraped so we don't retry endlessly
      try {
        await prisma.providerLead.update({
          where: { id: lead.id },
          data: { websiteScraped: true },
        });
      } catch {
        // ignore
      }
    }
  }

  // Check if there are more
  const remaining = await prisma.providerLead.count({
    where: {
      website: { not: null },
      websiteScraped: false,
    },
  });

  return {
    ok: true,
    message: `Enriched ${leadsEnriched} of ${leadsToEnrich.length} leads`,
    leadsProcessed: leadsToEnrich.length,
    leadsEnriched,
    contactsAdded,
    hasMore: remaining > 0,
  };
}

// ---------------------------------------------------------------------------
// Legacy types for backward compat (used by batch-discovery.tsx)
// ---------------------------------------------------------------------------

export type BatchProgress = {
  phase: "discovery" | "enrichment" | "done" | "error";
  current: number;
  total: number;
  message: string;
  totalSearches?: number;
  totalPlacesFound?: number;
  leadsImported?: number;
  leadsSkipped?: number;
  leadsEnriched?: number;
  contactsAdded?: number;
  errors?: string[];
};

// ---------------------------------------------------------------------------
// Reset enrichment: clear placeholder emails + reset websiteScraped flag
// This lets you re-run enrichment with an improved scraper.
// ---------------------------------------------------------------------------

export type ResetEnrichmentResult = {
  ok: boolean;
  message: string;
  placeholderEmailsDeleted: number;
  leadsReset: number;
};

export async function resetEnrichmentAction(): Promise<ResetEnrichmentResult> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return { ok: false, message: "Not authenticated", placeholderEmailsDeleted: 0, leadsReset: 0 };
  }

  const prisma = getPrisma();

  // 1. Delete all placeholder / junk email contacts
  const deletedPlaceholders = await prisma.leadContact.deleteMany({
    where: {
      channel: "EMAIL",
      OR: [
        { value: { startsWith: "no-email-found@" } },
        { value: { startsWith: "scrape-failed@" } },
        { value: { contains: "@placeholder" } },
      ],
    },
  });

  // 2. Reset websiteScraped flag on all leads
  const resetLeads = await prisma.providerLead.updateMany({
    where: { websiteScraped: true },
    data: { websiteScraped: false },
  });

  return {
    ok: true,
    message: `Deleted ${deletedPlaceholders.count} placeholder emails, reset ${resetLeads.count} leads for re-enrichment`,
    placeholderEmailsDeleted: deletedPlaceholders.count,
    leadsReset: resetLeads.count,
  };
}
