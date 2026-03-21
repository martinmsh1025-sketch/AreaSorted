export type BoroughPage = {
  slug: string;
  name: string;
  intro: string;
  highlights: string[];
  commonJobs: string[];
  nearbyAreas: string[];
};

export const boroughPages: BoroughPage[] = [
  {
    slug: "camden",
    name: "Camden",
    intro:
      "Book trusted local services in Camden with postcode-first coverage checks, clear pricing, and managed provider confirmation through AreaSorted.",
    highlights: ["Townhouses and flats", "End of tenancy demand", "Busy weekday scheduling"],
    commonJobs: ["End of tenancy cleaning", "Handyman odd jobs", "Waste removal", "Furniture assembly"],
    nearbyAreas: ["Kentish Town", "Bloomsbury", "Hampstead", "Primrose Hill"],
  },
  {
    slug: "islington",
    name: "Islington",
    intro:
      "Arrange local cleaning, handyman, pest control, and waste removal services in Islington through one managed London booking flow.",
    highlights: ["Victorian conversions", "Compact flats", "Fast access to Zone 1"],
    commonJobs: ["Regular cleaning", "Flat-pack assembly", "Pest inspections", "Small repair visits"],
    nearbyAreas: ["Angel", "Highbury", "Canonbury", "Barnsbury"],
  },
  {
    slug: "westminster",
    name: "Westminster",
    intro:
      "Check coverage and book vetted local service providers in Westminster with transparent pricing and central London support through AreaSorted.",
    highlights: ["High-density central locations", "Apartment cleaning", "Time-sensitive bookings"],
    commonJobs: ["Deep cleaning", "Waste collection", "Handyman visits", "Furniture setup"],
    nearbyAreas: ["Victoria", "Pimlico", "Marylebone", "Soho"],
  },
  {
    slug: "hackney",
    name: "Hackney",
    intro:
      "AreaSorted helps customers in Hackney continue booking trusted local service providers for cleaning, repairs, assembly, and maintenance work.",
    highlights: ["Mix of family homes and flats", "Creative workspaces", "Popular assembly and clearance jobs"],
    commonJobs: ["Furniture assembly", "Waste removal", "Garden tidy-ups", "General cleaning"],
    nearbyAreas: ["Dalston", "Shoreditch", "Clapton", "London Fields"],
  },
  {
    slug: "lambeth",
    name: "Lambeth",
    intro:
      "Find local service availability in Lambeth and continue booking through AreaSorted with clear pricing, booking support, and provider confirmation handling.",
    highlights: ["Busy residential turnover", "Short-notice cleaning", "South London handyman demand"],
    commonJobs: ["Move-out cleaning", "General handyman", "Waste removal", "Garden maintenance"],
    nearbyAreas: ["Brixton", "Clapham", "Streatham", "Vauxhall"],
  },
  {
    slug: "southwark",
    name: "Southwark",
    intro:
      "Book trusted local services in Southwark through AreaSorted with postcode checks, transparent pricing, and managed provider confirmation.",
    highlights: ["High-density flats", "Move-out cleaning demand", "Frequent waste clearance jobs"],
    commonJobs: ["End of tenancy cleaning", "Waste removal", "Handyman repairs", "Pest control"],
    nearbyAreas: ["Bermondsey", "Peckham", "Dulwich", "Bankside"],
  },
  {
    slug: "tower-hamlets",
    name: "Tower Hamlets",
    intro:
      "Arrange local services in Tower Hamlets with one managed booking flow covering pricing, temporary card holds, and provider confirmation.",
    highlights: ["Apartment-heavy stock", "Short-notice service demand", "Assembly and handyman jobs"],
    commonJobs: ["Regular cleaning", "Furniture assembly", "Handyman visits", "Waste removal"],
    nearbyAreas: ["Canary Wharf", "Bethnal Green", "Whitechapel", "Bow"],
  },
  {
    slug: "greenwich",
    name: "Greenwich",
    intro:
      "Check coverage and continue booking local cleaning, assembly, repair, and maintenance services in Greenwich through AreaSorted.",
    highlights: ["Family homes and riverside flats", "Garden jobs", "Recurring cleaning"],
    commonJobs: ["General cleaning", "Garden maintenance", "Furniture assembly", "Handyman jobs"],
    nearbyAreas: ["Blackheath", "Woolwich", "Charlton", "Eltham"],
  },
  {
    slug: "kensington-chelsea",
    name: "Kensington and Chelsea",
    intro:
      "Book vetted local service providers in Kensington and Chelsea with a postcode-first flow, transparent pricing, and managed confirmation.",
    highlights: ["Premium residential stock", "Deep cleaning demand", "Precision assembly and repairs"],
    commonJobs: ["Deep cleaning", "Handyman work", "Furniture assembly", "Pest control"],
    nearbyAreas: ["Notting Hill", "Chelsea", "South Kensington", "Earl's Court"],
  },
  {
    slug: "wandsworth",
    name: "Wandsworth",
    intro:
      "AreaSorted helps customers in Wandsworth check local service availability and continue booking with clear pricing and provider confirmation rules.",
    highlights: ["High residential turnover", "Family home cleaning", "Outdoor maintenance demand"],
    commonJobs: ["Regular cleaning", "Garden maintenance", "Waste removal", "Handyman repairs"],
    nearbyAreas: ["Clapham Junction", "Putney", "Balham", "Tooting"],
  },
];

export function getBoroughPage(slug: string) {
  return boroughPages.find((page) => page.slug === slug) ?? null;
}
