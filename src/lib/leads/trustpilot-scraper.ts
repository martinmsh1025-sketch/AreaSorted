// Trustpilot lead discovery for provider acquisition.
// Scrapes Trustpilot category and search pages to find London-based businesses.
// No API key required — data is extracted from __NEXT_DATA__ JSON embedded in HTML.

import { getPrisma } from "@/lib/db/prisma";
import type { LeadServiceCategory } from "@prisma/client";

// ---------------------------------------------------------------------------
// Trustpilot category slugs per service category
// ---------------------------------------------------------------------------

/**
 * Maps our service categories to Trustpilot.
 * - `categories`: Trustpilot category slugs (used for /categories/{slug}?location=London)
 * - `searches`: Fallback search queries (used for /search?query={q}&location=London)
 *   when no category page exists or to supplement results.
 */
export const TRUSTPILOT_MAPPINGS: Record<
  LeadServiceCategory,
  { categories: string[]; searches: string[] }
> = {
  CLEANING: {
    categories: ["cleaning_service"],
    searches: [],
  },
  PEST_CONTROL: {
    categories: ["pest_control_service"],
    searches: [],
  },
  HANDYMAN: {
    categories: ["handyman"],
    searches: [],
  },
  FURNITURE_ASSEMBLY: {
    categories: [],
    searches: ["furniture assembly London", "flatpack assembly London"],
  },
  WASTE_REMOVAL: {
    categories: [],
    searches: ["waste removal London", "rubbish clearance London"],
  },
  GARDEN_MAINTENANCE: {
    categories: ["gardener", "landscaper"],
    searches: [],
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw business data from Trustpilot's __NEXT_DATA__. */
export type TrustpilotBusiness = {
  businessUnitId: string;
  displayName: string;
  identifyingName: string; // e.g. "zenoven.co.uk"
  stars: number;
  trustScore: number;
  numberOfReviews: number;
  location: {
    address: string | null;
    city: string | null;
    zipCode: string | null;
    country: string | null;
  };
  contact: {
    website: string | null;
    email: string | null;
    phone: string | null;
  };
  categories: Array<{
    categoryId: string;
    displayName: string;
    isPrimary: boolean;
  }>;
};

/** Normalized lead ready for import. */
export type TrustpilotLead = {
  businessName: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  trustpilotUrl: string;
  trustScore: number | null;
  reviewCount: number | null;
  city: string | null;
  service: LeadServiceCategory;
  alreadyExists: boolean;
};

export type TrustpilotDiscoveryResult = {
  leads: TrustpilotLead[];
  service: LeadServiceCategory;
  totalFromTrustpilot: number;
  duplicatesSkipped: number;
  pagesScraped: number;
};

// ---------------------------------------------------------------------------
// Fetching helpers
// ---------------------------------------------------------------------------

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/**
 * Fetch a Trustpilot page and extract __NEXT_DATA__ JSON.
 */
async function fetchTrustpilotPage(url: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;

    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Category page scraping (e.g. /categories/cleaning_service?location=London)
// ---------------------------------------------------------------------------

/**
 * Scrape a Trustpilot category page.
 * Returns businesses from `pageProps.businessUnits.businesses` and pagination info.
 */
async function scrapeCategoryPage(
  categorySlug: string,
  page: number,
): Promise<{ businesses: TrustpilotBusiness[]; totalPages: number }> {
  const url =
    page === 1
      ? `https://uk.trustpilot.com/categories/${categorySlug}?location=London`
      : `https://uk.trustpilot.com/categories/${categorySlug}?location=London&page=${page}`;

  const data = await fetchTrustpilotPage(url);
  if (!data) return { businesses: [], totalPages: 0 };

  const pageProps = (data as { props?: { pageProps?: Record<string, unknown> } }).props?.pageProps;
  if (!pageProps) return { businesses: [], totalPages: 0 };

  const bu = pageProps.businessUnits as {
    businesses?: TrustpilotBusiness[];
    totalPages?: number;
  } | undefined;

  return {
    businesses: bu?.businesses ?? [],
    totalPages: bu?.totalPages ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Search page scraping (e.g. /search?query=furniture+assembly&location=London)
// ---------------------------------------------------------------------------

/**
 * Scrape a Trustpilot search results page.
 * Returns businesses from `pageProps.businessUnits` (array) and pagination info.
 */
async function scrapeSearchPage(
  query: string,
  page: number,
): Promise<{ businesses: TrustpilotBusiness[]; totalPages: number }> {
  const q = encodeURIComponent(query);
  const url =
    page === 1
      ? `https://uk.trustpilot.com/search?query=${q}&location=London`
      : `https://uk.trustpilot.com/search?query=${q}&location=London&page=${page}`;

  const data = await fetchTrustpilotPage(url);
  if (!data) return { businesses: [], totalPages: 0 };

  const pageProps = (data as { props?: { pageProps?: Record<string, unknown> } }).props?.pageProps;
  if (!pageProps) return { businesses: [], totalPages: 0 };

  // Search results: businessUnits is an array (not object)
  const businesses = pageProps.businessUnits as TrustpilotBusiness[] | undefined;
  const pagination = pageProps.pagination as { totalPages?: number } | undefined;

  return {
    businesses: Array.isArray(businesses) ? businesses : [],
    totalPages: pagination?.totalPages ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Main discovery function
// ---------------------------------------------------------------------------

/** Maximum pages to scrape per category/search to avoid hammering Trustpilot. */
const MAX_PAGES_PER_SOURCE = 10;

/** Delay between page fetches (ms). */
const PAGE_DELAY = 300;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Discover providers on Trustpilot for a given service category.
 * Scrapes both category pages and search results, deduplicates, and marks existing leads.
 */
export async function discoverTrustpilotProviders(
  service: LeadServiceCategory,
  maxPages: number = MAX_PAGES_PER_SOURCE,
): Promise<TrustpilotDiscoveryResult> {
  const mapping = TRUSTPILOT_MAPPINGS[service];
  if (!mapping) {
    throw new Error(`No Trustpilot mapping for service: ${service}`);
  }

  // Collect all businesses, deduplicate by businessUnitId
  const seenIds = new Set<string>();
  const allBusinesses: TrustpilotBusiness[] = [];
  let pagesScraped = 0;

  // 1. Scrape category pages
  for (const categorySlug of mapping.categories) {
    const firstPage = await scrapeCategoryPage(categorySlug, 1);
    pagesScraped++;

    for (const biz of firstPage.businesses) {
      if (!seenIds.has(biz.businessUnitId)) {
        seenIds.add(biz.businessUnitId);
        allBusinesses.push(biz);
      }
    }

    const totalPages = Math.min(firstPage.totalPages, maxPages);
    for (let page = 2; page <= totalPages; page++) {
      await delay(PAGE_DELAY);
      const pageResult = await scrapeCategoryPage(categorySlug, page);
      pagesScraped++;

      for (const biz of pageResult.businesses) {
        if (!seenIds.has(biz.businessUnitId)) {
          seenIds.add(biz.businessUnitId);
          allBusinesses.push(biz);
        }
      }
    }
  }

  // 2. Scrape search pages
  for (const query of mapping.searches) {
    const firstPage = await scrapeSearchPage(query, 1);
    pagesScraped++;

    for (const biz of firstPage.businesses) {
      if (!seenIds.has(biz.businessUnitId)) {
        seenIds.add(biz.businessUnitId);
        allBusinesses.push(biz);
      }
    }

    const totalPages = Math.min(firstPage.totalPages, maxPages);
    for (let page = 2; page <= totalPages; page++) {
      await delay(PAGE_DELAY);
      const pageResult = await scrapeSearchPage(query, page);
      pagesScraped++;

      for (const biz of pageResult.businesses) {
        if (!seenIds.has(biz.businessUnitId)) {
          seenIds.add(biz.businessUnitId);
          allBusinesses.push(biz);
        }
      }
    }
  }

  // 3. Check for existing leads by business name
  const prisma = getPrisma();
  const existingLeads = await prisma.providerLead.findMany({
    select: { businessName: true },
  });
  const existingNames = new Set(
    existingLeads.map((l) => l.businessName.toLowerCase().trim()),
  );

  let duplicatesSkipped = 0;
  const leads: TrustpilotLead[] = [];

  for (const biz of allBusinesses) {
    const name = biz.displayName;
    if (!name) continue;

    const alreadyExists = existingNames.has(name.toLowerCase().trim());
    if (alreadyExists) duplicatesSkipped++;

    // Clean website URL (strip Trustpilot UTM params)
    let website = biz.contact?.website ?? null;
    if (website) {
      try {
        const url = new URL(website);
        // Remove common tracking params
        url.searchParams.delete("utm_source");
        url.searchParams.delete("utm_medium");
        url.searchParams.delete("utm_campaign");
        url.searchParams.delete("utm_content");
        url.searchParams.delete("utm_term");
        url.searchParams.delete("mar");
        website = url.toString();
        // Remove trailing ? if no params left
        if (website.endsWith("?")) website = website.slice(0, -1);
      } catch {
        // Keep original if URL parsing fails
      }
    }

    leads.push({
      businessName: name,
      website,
      email: biz.contact?.email ?? null,
      phone: biz.contact?.phone ?? null,
      trustpilotUrl: `https://uk.trustpilot.com/review/${biz.identifyingName}`,
      trustScore: biz.trustScore ?? null,
      reviewCount: biz.numberOfReviews ?? null,
      city: biz.location?.city ?? null,
      service,
      alreadyExists,
    });
  }

  return {
    leads,
    service,
    totalFromTrustpilot: allBusinesses.length,
    duplicatesSkipped,
    pagesScraped,
  };
}

// ---------------------------------------------------------------------------
// Import Trustpilot leads into database
// ---------------------------------------------------------------------------

export async function importTrustpilotLeads(
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
): Promise<{ imported: number; skipped: number }> {
  const prisma = getPrisma();
  let imported = 0;
  let skipped = 0;

  for (const lead of leads) {
    // Deduplicate by business name
    const existing = await prisma.providerLead.findFirst({
      where: { businessName: { equals: lead.businessName, mode: "insensitive" } },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const created = await prisma.providerLead.create({
      data: {
        businessName: lead.businessName,
        leadType: "UNKNOWN",
        services: [lead.service],
        boroughs: [], // Trustpilot doesn't give borough-level data
        website: lead.website,
        sourceUrl: lead.trustpilotUrl,
        source: "TRUSTPILOT",
        score: computeTrustpilotScore(lead.trustScore, lead.reviewCount),
        status: "NEW",
        notes: lead.trustpilotUrl,
        tags: lead.trustScore ? [`trustpilot-${lead.trustScore}`] : [],
      },
    });

    // Create email contact if available
    if (lead.email) {
      await prisma.leadContact.create({
        data: {
          leadId: created.id,
          channel: "EMAIL",
          value: lead.email,
          publicSource: "Trustpilot listing",
          isPrimary: true,
        },
      });
    }

    // Create phone contact if available
    if (lead.phone) {
      await prisma.leadContact.create({
        data: {
          leadId: created.id,
          channel: "PHONE",
          value: lead.phone,
          publicSource: "Trustpilot listing",
          isPrimary: !lead.email, // Primary only if no email
        },
      });
    }

    imported++;
  }

  return { imported, skipped };
}

// ---------------------------------------------------------------------------
// Scoring based on Trustpilot data
// ---------------------------------------------------------------------------

export function computeTrustpilotScore(
  trustScore: number | null,
  reviewCount: number | null,
): number {
  let score = 25; // Base score for being on Trustpilot

  if (trustScore) {
    if (trustScore >= 4.5) score += 30;
    else if (trustScore >= 4.0) score += 20;
    else if (trustScore >= 3.5) score += 10;
    else if (trustScore < 2.0) score -= 10; // Penalize very low ratings
  }

  if (reviewCount) {
    if (reviewCount >= 100) score += 30;
    else if (reviewCount >= 50) score += 25;
    else if (reviewCount >= 20) score += 15;
    else if (reviewCount >= 5) score += 10;
  }

  return Math.max(0, Math.min(100, score));
}
