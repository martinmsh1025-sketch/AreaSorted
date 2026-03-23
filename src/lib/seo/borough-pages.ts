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
  {
    slug: "barking-dagenham",
    name: "Barking and Dagenham",
    intro:
      "AreaSorted helps customers in Barking and Dagenham check local service coverage and continue booking with clear pricing and managed provider confirmation.",
    highlights: ["Outer East London travel planning", "Busy family households", "Repeat cleaning and repair demand"],
    commonJobs: ["Regular cleaning", "Handyman repairs", "Waste removal", "Garden maintenance"],
    nearbyAreas: ["Barking", "Dagenham", "Becontree", "Chadwell Heath"],
  },
  {
    slug: "barnet",
    name: "Barnet",
    intro:
      "Check AreaSorted service availability in Barnet for cleaning, assembly, repairs, pest control, and practical home support across North London postcodes.",
    highlights: ["Family homes", "Longer travel windows", "Regular cleaning demand"],
    commonJobs: ["Regular cleaning", "Handyman repairs", "Furniture assembly", "Garden maintenance"],
    nearbyAreas: ["Finchley", "Hendon", "Golders Green", "Mill Hill"],
  },
  {
    slug: "bexley",
    name: "Bexley",
    intro:
      "AreaSorted helps customers in Bexley continue booking local services with postcode-first coverage checks and transparent pricing before confirmation.",
    highlights: ["Residential suburbs", "Weekend demand", "Garden and clearance jobs"],
    commonJobs: ["General cleaning", "Garden maintenance", "Waste removal", "Handyman visits"],
    nearbyAreas: ["Sidcup", "Welling", "Bexleyheath", "Erith"],
  },
  {
    slug: "brent",
    name: "Brent",
    intro:
      "Book vetted local services in Brent through AreaSorted, from cleaning and handyman work to pest control, assembly, and waste removal.",
    highlights: ["Busy mixed housing stock", "Short-notice demand", "High move-in and move-out activity"],
    commonJobs: ["End of tenancy cleaning", "Furniture assembly", "Waste removal", "Pest control"],
    nearbyAreas: ["Wembley", "Kilburn", "Neasden", "Willesden"],
  },
  {
    slug: "bromley",
    name: "Bromley",
    intro:
      "Arrange local services in Bromley with postcode-led coverage checks, clear pricing, and provider confirmation handled through AreaSorted.",
    highlights: ["Larger homes", "Outdoor maintenance demand", "Recurring domestic jobs"],
    commonJobs: ["Regular cleaning", "Garden maintenance", "Handyman work", "Waste collection"],
    nearbyAreas: ["Beckenham", "Orpington", "Chislehurst", "Shortlands"],
  },
  {
    slug: "croydon",
    name: "Croydon",
    intro:
      "Continue booking trusted local services in Croydon through AreaSorted for cleaning, repairs, assembly, clearance, and maintenance jobs.",
    highlights: ["High-density housing mix", "Fast turnaround jobs", "Strong cleaning demand"],
    commonJobs: ["General cleaning", "Handyman repairs", "Furniture assembly", "Waste removal"],
    nearbyAreas: ["Purley", "South Croydon", "Thornton Heath", "Norbury"],
  },
  {
    slug: "ealing",
    name: "Ealing",
    intro:
      "AreaSorted helps customers in Ealing book local cleaning, handyman, pest control, and home support services with a managed booking flow.",
    highlights: ["Family homes and flats", "Commuter-heavy schedules", "Frequent maintenance bookings"],
    commonJobs: ["Regular cleaning", "Handyman work", "Pest inspections", "Furniture assembly"],
    nearbyAreas: ["Acton", "Hanwell", "Southall", "Northfields"],
  },
  {
    slug: "enfield",
    name: "Enfield",
    intro:
      "Check local service coverage in Enfield with AreaSorted and continue booking once your address, timing, and provider fit are confirmed.",
    highlights: ["Outer London travel planning", "Family homes", "Recurring cleaning and repair jobs"],
    commonJobs: ["Regular cleaning", "Handyman repairs", "Garden maintenance", "Waste removal"],
    nearbyAreas: ["Winchmore Hill", "Palmers Green", "Edmonton", "Southgate"],
  },
  {
    slug: "hammersmith-fulham",
    name: "Hammersmith and Fulham",
    intro:
      "Book trusted local services in Hammersmith and Fulham with transparent pricing, postcode matching, and managed provider confirmation through AreaSorted.",
    highlights: ["Dense residential streets", "Flats and terraced homes", "Fast-turnaround jobs"],
    commonJobs: ["Regular cleaning", "End of tenancy cleaning", "Furniture assembly", "Handyman visits"],
    nearbyAreas: ["Fulham", "Hammersmith", "Shepherd's Bush", "West Kensington"],
  },
  {
    slug: "haringey",
    name: "Haringey",
    intro:
      "AreaSorted supports bookings across Haringey for cleaning, assembly, repairs, pest control, and practical home services.",
    highlights: ["Victorian terraces", "Mixed household sizes", "Strong handyman demand"],
    commonJobs: ["General cleaning", "Handyman repairs", "Furniture assembly", "Pest control"],
    nearbyAreas: ["Crouch End", "Muswell Hill", "Tottenham", "Hornsey"],
  },
  {
    slug: "harrow",
    name: "Harrow",
    intro:
      "Find local service availability in Harrow and continue booking through AreaSorted with clear pricing and postcode-first provider matching.",
    highlights: ["Suburban homes", "Weekend availability", "Routine maintenance jobs"],
    commonJobs: ["Regular cleaning", "Garden maintenance", "Handyman work", "Waste collection"],
    nearbyAreas: ["Pinner", "Wealdstone", "Rayners Lane", "Stanmore"],
  },
  {
    slug: "havering",
    name: "Havering",
    intro:
      "AreaSorted helps customers in Havering book local services with managed confirmation, pricing checks, and practical support from quote to job day.",
    highlights: ["Outer East London coverage", "Larger homes", "Garden and clearance demand"],
    commonJobs: ["General cleaning", "Garden maintenance", "Waste removal", "Handyman repairs"],
    nearbyAreas: ["Romford", "Hornchurch", "Upminster", "Rainham"],
  },
  {
    slug: "hillingdon",
    name: "Hillingdon",
    intro:
      "Arrange local cleaning, repairs, clearance, and maintenance services in Hillingdon through one structured AreaSorted booking flow.",
    highlights: ["Wide travel coverage", "Residential and commercial mix", "Flexible scheduling demand"],
    commonJobs: ["General cleaning", "Handyman visits", "Waste removal", "Furniture assembly"],
    nearbyAreas: ["Uxbridge", "Hayes", "Ruislip", "West Drayton"],
  },
  {
    slug: "hounslow",
    name: "Hounslow",
    intro:
      "Book trusted local services in Hounslow with postcode-led coverage checks, transparent pricing, and managed provider confirmation through AreaSorted.",
    highlights: ["Busy mixed housing stock", "Airport corridor demand", "Regular cleaning and repairs"],
    commonJobs: ["Regular cleaning", "Handyman work", "Furniture assembly", "Waste collection"],
    nearbyAreas: ["Chiswick", "Isleworth", "Brentford", "Feltham"],
  },
  {
    slug: "kingston-upon-thames",
    name: "Kingston upon Thames",
    intro:
      "Check coverage and continue booking local services in Kingston upon Thames with AreaSorted for cleaning, repairs, assembly, and maintenance work.",
    highlights: ["Family households", "Student and rental demand", "Recurring home support"],
    commonJobs: ["Regular cleaning", "Furniture assembly", "Handyman repairs", "Garden maintenance"],
    nearbyAreas: ["Surbiton", "New Malden", "Chessington", "Norbiton"],
  },
  {
    slug: "lewisham",
    name: "Lewisham",
    intro:
      "AreaSorted helps customers in Lewisham book trusted local services with postcode matching, clear booking expectations, and transparent pricing.",
    highlights: ["High-density housing mix", "Short-notice cleaning demand", "Strong assembly and repair demand"],
    commonJobs: ["General cleaning", "Furniture assembly", "Handyman visits", "Waste removal"],
    nearbyAreas: ["Deptford", "Catford", "Brockley", "New Cross"],
  },
  {
    slug: "merton",
    name: "Merton",
    intro:
      "Book local cleaning, handyman, pest control, and maintenance services in Merton through AreaSorted with managed provider confirmation.",
    highlights: ["Family homes", "Regular domestic demand", "Garden and maintenance jobs"],
    commonJobs: ["Regular cleaning", "Garden maintenance", "Handyman work", "Furniture assembly"],
    nearbyAreas: ["Wimbledon", "Mitcham", "Colliers Wood", "Raynes Park"],
  },
  {
    slug: "newham",
    name: "Newham",
    intro:
      "Arrange local services in Newham through AreaSorted, from cleaning and assembly to repairs, pest control, and waste removal.",
    highlights: ["Apartment-heavy areas", "Fast-moving rental demand", "Busy weekday scheduling"],
    commonJobs: ["End of tenancy cleaning", "Furniture assembly", "Waste removal", "Pest control"],
    nearbyAreas: ["Stratford", "Canning Town", "Plaistow", "Forest Gate"],
  },
  {
    slug: "redbridge",
    name: "Redbridge",
    intro:
      "Check local service coverage in Redbridge and continue booking through AreaSorted with postcode checks, pricing clarity, and managed provider matching.",
    highlights: ["Family households", "Outer East London travel planning", "Repeat booking potential"],
    commonJobs: ["Regular cleaning", "Handyman repairs", "Garden maintenance", "Waste removal"],
    nearbyAreas: ["Ilford", "Wanstead", "Woodford", "Barkingside"],
  },
  {
    slug: "richmond-upon-thames",
    name: "Richmond upon Thames",
    intro:
      "AreaSorted supports local bookings in Richmond upon Thames for premium home cleaning, assembly, repairs, and practical maintenance jobs.",
    highlights: ["Premium residential stock", "Family homes", "High-quality recurring service demand"],
    commonJobs: ["Regular cleaning", "Deep cleaning", "Handyman work", "Garden maintenance"],
    nearbyAreas: ["Richmond", "Kew", "Teddington", "Twickenham"],
  },
  {
    slug: "sutton",
    name: "Sutton",
    intro:
      "Find trusted local service availability in Sutton and continue booking through AreaSorted with transparent pricing and postcode-first checks.",
    highlights: ["Residential suburbs", "Routine maintenance jobs", "Family home cleaning"],
    commonJobs: ["Regular cleaning", "Handyman visits", "Garden maintenance", "Waste collection"],
    nearbyAreas: ["Carshalton", "Cheam", "Wallington", "Belmont"],
  },
  {
    slug: "waltham-forest",
    name: "Waltham Forest",
    intro:
      "Book trusted local services in Waltham Forest with AreaSorted for cleaning, repairs, furniture assembly, pest control, and waste removal.",
    highlights: ["Mixed housing stock", "Creative and family households", "Strong cleaning and repair demand"],
    commonJobs: ["General cleaning", "Furniture assembly", "Handyman work", "Waste removal"],
    nearbyAreas: ["Walthamstow", "Leyton", "Chingford", "South Woodford"],
  },
];

export function getBoroughPage(slug: string) {
  return boroughPages.find((page) => page.slug === slug) ?? null;
}
