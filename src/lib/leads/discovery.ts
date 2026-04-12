// Google Places API lead discovery for provider acquisition.
// Uses Places API (New) Text Search to find businesses by borough + service.

import { getPrisma } from "@/lib/db/prisma";
import type { LeadServiceCategory, LeadSource } from "@prisma/client";

// ---------------------------------------------------------------------------
// Borough center coordinates (approximate) for biasing search results
// ---------------------------------------------------------------------------

export const BOROUGH_COORDINATES: Record<string, { lat: number; lng: number }> = {
  camden: { lat: 51.5517, lng: -0.1588 },
  islington: { lat: 51.5362, lng: -0.1033 },
  westminster: { lat: 51.4973, lng: -0.1372 },
  hackney: { lat: 51.5450, lng: -0.0553 },
  lambeth: { lat: 51.4571, lng: -0.1231 },
  southwark: { lat: 51.4734, lng: -0.0755 },
  "tower-hamlets": { lat: 51.5203, lng: -0.0293 },
  greenwich: { lat: 51.4769, lng: 0.0005 },
  lewisham: { lat: 51.4535, lng: -0.0205 },
  newham: { lat: 51.5255, lng: 0.0352 },
  "waltham-forest": { lat: 51.5886, lng: -0.0120 },
  haringey: { lat: 51.5906, lng: -0.1110 },
  enfield: { lat: 51.6538, lng: -0.0799 },
  barnet: { lat: 51.6252, lng: -0.1517 },
  brent: { lat: 51.5588, lng: -0.2817 },
  ealing: { lat: 51.5133, lng: -0.3057 },
  "hammersmith-and-fulham": { lat: 51.4927, lng: -0.2339 },
  "kensington-and-chelsea": { lat: 51.4991, lng: -0.1938 },
  wandsworth: { lat: 51.4567, lng: -0.1910 },
  merton: { lat: 51.4015, lng: -0.1949 },
  "richmond-upon-thames": { lat: 51.4479, lng: -0.3260 },
  "kingston-upon-thames": { lat: 51.3925, lng: -0.3057 },
  sutton: { lat: 51.3618, lng: -0.1945 },
  croydon: { lat: 51.3714, lng: -0.0977 },
  bromley: { lat: 51.4039, lng: 0.0198 },
  bexley: { lat: 51.4549, lng: 0.1505 },
  havering: { lat: 51.5812, lng: 0.1837 },
  barking: { lat: 51.5397, lng: 0.0808 },
  redbridge: { lat: 51.5590, lng: 0.0741 },
  hillingdon: { lat: 51.5441, lng: -0.4760 },
  hounslow: { lat: 51.4746, lng: -0.3680 },
  harrow: { lat: 51.5898, lng: -0.3346 },
};

// ---------------------------------------------------------------------------
// Search query templates per service category
// ---------------------------------------------------------------------------

export const SERVICE_SEARCH_QUERIES: Record<LeadServiceCategory, string[]> = {
  CLEANING: [
    "cleaning services",
    "domestic cleaning company",
    "office cleaning",
    "end of tenancy cleaning",
  ],
  PEST_CONTROL: [
    "pest control services",
    "pest exterminator",
  ],
  HANDYMAN: [
    "handyman services",
    "local handyman",
    "home repair services",
  ],
  FURNITURE_ASSEMBLY: [
    "furniture assembly service",
    "flatpack assembly",
  ],
  WASTE_REMOVAL: [
    "waste removal service",
    "rubbish clearance",
    "house clearance",
  ],
  GARDEN_MAINTENANCE: [
    "garden maintenance service",
    "gardener",
    "garden cleaning service",
  ],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiscoveredLead = {
  businessName: string;
  address: string;
  phone: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  types: string[];
  placeId: string;
  borough: string;
  service: LeadServiceCategory;
  alreadyExists: boolean;
};

export type DiscoveryResult = {
  leads: DiscoveredLead[];
  query: string;
  borough: string;
  service: LeadServiceCategory;
  totalFromApi: number;
  duplicatesSkipped: number;
};

// ---------------------------------------------------------------------------
// Google Places Text Search (New API)
// ---------------------------------------------------------------------------

export async function searchGooglePlaces(
  query: string,
  center: { lat: number; lng: number },
  apiKey: string,
): Promise<Array<{
  displayName: { text: string };
  formattedAddress: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  id: string;
}>> {
  // Use Places API (New) — Text Search
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: 5000.0, // 5km radius
      },
    },
    maxResultCount: 20,
    languageCode: "en",
    regionCode: "GB",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.rating",
        "places.userRatingCount",
        "places.types",
        "places.id",
      ].join(","),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.places || [];
}

// ---------------------------------------------------------------------------
// Main discovery function
// ---------------------------------------------------------------------------

export async function discoverProviders(
  boroughSlug: string,
  service: LeadServiceCategory,
): Promise<DiscoveryResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "replace-with-google-maps-key") {
    throw new Error("Google Maps API key not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local");
  }

  const center = BOROUGH_COORDINATES[boroughSlug];
  if (!center) {
    throw new Error(`Unknown borough: ${boroughSlug}`);
  }

  // Get borough display name from slug
  const boroughName = boroughSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const queries = SERVICE_SEARCH_QUERIES[service];
  if (!queries || queries.length === 0) {
    throw new Error(`No search queries for service: ${service}`);
  }

  // Use first query + borough name for primary search
  const searchQuery = `${queries[0]} in ${boroughName} London`;

  const places = await searchGooglePlaces(searchQuery, center, apiKey);

  // Check for existing leads by business name
  const prisma = getPrisma();
  const existingLeads = await prisma.providerLead.findMany({
    select: { businessName: true },
  });
  const existingNames = new Set(
    existingLeads.map((l) => l.businessName.toLowerCase().trim()),
  );

  let duplicatesSkipped = 0;
  const leads: DiscoveredLead[] = [];

  for (const place of places) {
    const name = place.displayName?.text;
    if (!name) continue;

    const alreadyExists = existingNames.has(name.toLowerCase().trim());
    if (alreadyExists) duplicatesSkipped++;

    leads.push({
      businessName: name,
      address: place.formattedAddress || "",
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
      website: place.websiteUri || null,
      googleMapsUrl: place.googleMapsUri || null,
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      types: place.types || [],
      placeId: place.id,
      borough: boroughSlug,
      service,
      alreadyExists,
    });
  }

  return {
    leads,
    query: searchQuery,
    borough: boroughSlug,
    service,
    totalFromApi: places.length,
    duplicatesSkipped,
  };
}

// ---------------------------------------------------------------------------
// Import discovered leads into database
// ---------------------------------------------------------------------------

export async function importDiscoveredLeads(
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
        boroughs: [lead.borough],
        website: lead.website,
        sourceUrl: lead.googleMapsUrl,
        source: "GOOGLE_MAPS",
        score: computeBasicScore(lead.rating, lead.reviewCount),
        status: "NEW",
        notes: lead.address,
        tags: lead.rating ? [`rating-${lead.rating}`] : [],
      },
    });

    // Create phone contact if available
    if (lead.phone) {
      await prisma.leadContact.create({
        data: {
          leadId: created.id,
          channel: "PHONE",
          value: lead.phone,
          publicSource: "Google Maps listing",
          isPrimary: true,
        },
      });
    }

    imported++;
  }

  return { imported, skipped };
}

// ---------------------------------------------------------------------------
// Basic scoring based on Google data
// ---------------------------------------------------------------------------

export function computeBasicScore(rating: number | null, reviewCount: number | null): number {
  let score = 30; // base score for being findable on Google

  if (rating) {
    if (rating >= 4.5) score += 30;
    else if (rating >= 4.0) score += 20;
    else if (rating >= 3.5) score += 10;
  }

  if (reviewCount) {
    if (reviewCount >= 50) score += 25;
    else if (reviewCount >= 20) score += 15;
    else if (reviewCount >= 5) score += 10;
  }

  return Math.min(100, score);
}
