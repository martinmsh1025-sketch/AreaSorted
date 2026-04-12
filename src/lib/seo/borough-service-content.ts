import type { ServiceValue } from "@/lib/service-catalog";

export type BoroughServiceContent = {
  service: ServiceValue;
  slug: string;
  label: string;
  eyebrow: string;
  leadDescription: (boroughName: string) => string;
  popularNeeds: string[];
  demandDescription: (boroughName: string, highlights: string[]) => string;
  pricingFactors: string[];
  faqItems: (boroughName: string) => Array<{ question: string; answer: string }>;
};

export const boroughServiceContent: BoroughServiceContent[] = [
  {
    service: "cleaning",
    slug: "cleaning",
    label: "Cleaning",
    eyebrow: "Local cleaning",
    leadDescription: (b) =>
      `Book cleaning services in ${b} through AreaSorted with postcode-first coverage checks, clearer pricing, and managed booking confirmation.`,
    popularNeeds: [
      "Regular home cleaning for weekly or fortnightly routines",
      "End of tenancy cleaning for move-outs and handovers",
      "Deep cleaning before guests, inspections, or returns to market",
      "Specialist cleaning add-ons such as ovens, carpets, or internal windows",
    ],
    demandDescription: (b, highlights) =>
      `${b} customers often book cleaning for ${highlights.join(", ").toLowerCase()}. AreaSorted helps turn that into a clearer flow by checking coverage first, showing pricing before checkout, and managing confirmation through one place.`,
    pricingFactors: [
      "Property size and type",
      "Cleaning condition and amount of work needed",
      "Urgency, weekend, and evening timing",
      "Postcode and access considerations",
      "Add-ons such as oven cleaning or inside windows",
    ],
    faqItems: (b) => [
      {
        question: `What cleaning services can I book in ${b}?`,
        answer: `AreaSorted supports regular home cleaning, end of tenancy cleaning, carpet and upholstery cleaning, appliance cleaning, window cleaning, and targeted room deep cleans in ${b}.`,
      },
      {
        question: `What affects cleaning prices in ${b}?`,
        answer: `Cleaning prices depend on job type, property size, property type, cleaning condition, timing, postcode, and add-ons such as oven cleaning or inside windows.`,
      },
      {
        question: `How does booking work for cleaning in ${b}?`,
        answer: `Start with your postcode, review the cleaning quote, and continue with a temporary card hold. Payment is only captured once the booking is confirmed.`,
      },
    ],
  },
  {
    service: "pest-control",
    slug: "pest-control",
    label: "Pest Control",
    eyebrow: "Local pest control",
    leadDescription: (b) =>
      `Book pest control services in ${b} through AreaSorted with inspection-led pricing, postcode coverage checks, and managed booking confirmation.`,
    popularNeeds: [
      "Rat and mouse treatments for homes and rental properties",
      "Cockroach, bed bug, flea, and ant treatments",
      "Pest inspections and written reports for landlords",
      "Proofing and follow-up visits after initial treatment",
    ],
    demandDescription: (b, highlights) =>
      `Pest control demand in ${b} often relates to ${highlights.join(", ").toLowerCase()}. AreaSorted connects customers with inspection-led providers who assess the issue before confirming a treatment plan.`,
    pricingFactors: [
      "Pest type and treatment complexity",
      "Whether the visit is inspection-led or treatment-led",
      "Property size, access, and repeat infestation level",
      "Urgency, timing, and postcode",
      "Need for reports, proofing, or follow-up visits",
    ],
    faqItems: (b) => [
      {
        question: `What pest control services can I book in ${b}?`,
        answer: `AreaSorted supports rodent control, insect treatments, inspections, written reports, proofing work, and follow-up pest visits in ${b} depending on the issue and property type.`,
      },
      {
        question: `What affects pest control prices in ${b}?`,
        answer: `Pest control quotes depend on the type of pest, property size, urgency, access, complexity, report requirements, follow-up needs, and postcode.`,
      },
      {
        question: `How does pest control booking work in ${b}?`,
        answer: `Describe the issue, review the quote or inspection route, and continue with a temporary card hold. Once the booking is confirmed, payment is captured and the job moves forward.`,
      },
    ],
  },
  {
    service: "handyman",
    slug: "handyman",
    label: "Handyman",
    eyebrow: "Local handyman",
    leadDescription: (b) =>
      `Book handyman services in ${b} through AreaSorted for mounting, repairs, fittings, and practical home jobs with clear task-based pricing.`,
    popularNeeds: [
      "TV mounting, mirror hanging, shelves, and wall fixtures",
      "Minor repairs and practical adjustments around the home",
      "Fixtures, fittings, and replacement tasks",
      "Small moving, alignment, and repositioning jobs",
    ],
    demandDescription: (b, highlights) =>
      `Handyman demand in ${b} often comes from ${highlights.join(", ").toLowerCase()}. AreaSorted helps customers find task-based handyman work with structured quotes and managed provider confirmation.`,
    pricingFactors: [
      "Task complexity and expected time on site",
      "Single-job versus multi-task requests",
      "Access, wall type, fittings, and job-specific constraints",
      "Urgency, timing, and postcode",
      "Any materials or extra items involved in the visit",
    ],
    faqItems: (b) => [
      {
        question: `What handyman jobs can I book in ${b}?`,
        answer: `AreaSorted supports mounting, hanging, minor repairs, fixtures and fittings, flat adjustments, furniture-related tasks, and light installation work in ${b} depending on the job type.`,
      },
      {
        question: `What affects handyman prices in ${b}?`,
        answer: `Handyman quotes depend on the task type, job size, access, urgency, timing, postcode, and whether additional materials or extra tasks are involved.`,
      },
      {
        question: `How does handyman booking work in ${b}?`,
        answer: `Describe the task clearly, review the quote, and continue with a temporary card hold. Once a suitable local provider confirms availability, payment is captured and the booking progresses.`,
      },
    ],
  },
  {
    service: "furniture-assembly",
    slug: "furniture-assembly",
    label: "Furniture Assembly",
    eyebrow: "Local furniture assembly",
    leadDescription: (b) =>
      `Book furniture assembly services in ${b} through AreaSorted for flat-pack builds, bedroom and office furniture, disassembly, and anchoring work.`,
    popularNeeds: [
      "Wardrobes, beds, bedside furniture, and bedroom storage",
      "Desks, office units, and work-from-home furniture",
      "Dining tables, chairs, shelving, and living room items",
      "Disassembly and reassembly during moves or room changes",
    ],
    demandDescription: (b, highlights) =>
      `Assembly demand in ${b} often relates to ${highlights.join(", ").toLowerCase()}. AreaSorted helps customers book flat-pack and furniture setup work with clear pricing and managed confirmation.`,
    pricingFactors: [
      "Item type and assembly complexity",
      "Number of pieces or items involved",
      "Anchoring needs and wall conditions",
      "Access, urgency, and postcode",
      "Whether disassembly or repositioning is also needed",
    ],
    faqItems: (b) => [
      {
        question: `What furniture assembly jobs can I book in ${b}?`,
        answer: `AreaSorted supports flat-pack assembly, bedroom furniture, wardrobes, desks, shelving, dining furniture, disassembly, and anchoring tasks in ${b} depending on the item type.`,
      },
      {
        question: `What affects furniture assembly pricing in ${b}?`,
        answer: `Quotes depend on the item type, assembly complexity, number of pieces, anchoring needs, access, urgency, postcode, and whether disassembly is also needed.`,
      },
      {
        question: `How does furniture assembly booking work in ${b}?`,
        answer: `Describe the items, review the quote, and continue with a temporary card hold. Payment is only captured once the booking is confirmed by a provider.`,
      },
    ],
  },
  {
    service: "waste-removal",
    slug: "waste-removal",
    label: "Waste Removal",
    eyebrow: "Local waste removal",
    leadDescription: (b) =>
      `Book waste removal services in ${b} through AreaSorted for bulky items, household clearances, garden waste, and property tidy-up jobs.`,
    popularNeeds: [
      "Bulky household item removal and single-item collections",
      "Rubbish clearance after moves, tidy-ups, or maintenance work",
      "Garden waste and outdoor clearance tasks",
      "Property-level clearances for homes and rental turnarounds",
    ],
    demandDescription: (b, highlights) =>
      `Waste removal demand in ${b} often comes from ${highlights.join(", ").toLowerCase()}. AreaSorted connects customers with providers who handle bulky items, household waste, and property clearances.`,
    pricingFactors: [
      "Load size, item count, and collection type",
      "Access, stairs, parking, and loading time",
      "Whether photos are needed to confirm the scope",
      "Urgency, timing, and postcode",
      "Special disposal requirements for certain items",
    ],
    faqItems: (b) => [
      {
        question: `What waste removal jobs can I book in ${b}?`,
        answer: `AreaSorted supports household waste collection, bulky item removal, property clearances, garden waste jobs, and some special disposal requests in ${b} depending on the item type.`,
      },
      {
        question: `What affects waste removal prices in ${b}?`,
        answer: `Quotes depend on volume, item type, access, stairs, loading time, urgency, postcode, and whether photos are needed to confirm the job size.`,
      },
      {
        question: `How does waste removal booking work in ${b}?`,
        answer: `Start with your postcode, describe the waste job clearly, and continue with a temporary card hold. Once the booking is confirmed, payment is captured and the collection moves forward.`,
      },
    ],
  },
  {
    service: "garden-maintenance",
    slug: "garden-maintenance",
    label: "Garden Maintenance",
    eyebrow: "Local garden maintenance",
    leadDescription: (b) =>
      `Book garden maintenance services in ${b} through AreaSorted for tidy-ups, lawn care, hedge cutting, seasonal work, and outdoor finishing jobs.`,
    popularNeeds: [
      "Lawn mowing and routine garden upkeep",
      "Hedge trimming, pruning, and cutting back",
      "Seasonal tidy-ups and overgrowth control",
      "Leaf clearance and general outdoor resetting",
    ],
    demandDescription: (b, highlights) =>
      `Garden maintenance demand in ${b} often relates to ${highlights.join(", ").toLowerCase()}. AreaSorted helps customers book routine garden work, seasonal tidy-ups, and cutting jobs with clear pricing.`,
    pricingFactors: [
      "Garden size and growth level",
      "Waste volume and disposal handling",
      "Equipment needs and access conditions",
      "Urgency, timing, and postcode",
      "Whether the booking is routine or seasonal one-off",
    ],
    faqItems: (b) => [
      {
        question: `What garden maintenance jobs can I book in ${b}?`,
        answer: `AreaSorted supports lawn care, hedge trimming, garden tidy-ups, seasonal clearance, cutting, pruning, and selected outdoor washing or finishing work in ${b} depending on the job type.`,
      },
      {
        question: `What affects garden maintenance prices in ${b}?`,
        answer: `Garden quotes depend on garden size, growth level, waste volume, access, equipment needs, timing, postcode, and whether the booking is routine or seasonal.`,
      },
      {
        question: `How does garden maintenance booking work in ${b}?`,
        answer: `Describe the garden job, review the quote, and continue with a temporary card hold. Payment is only captured once the booking is confirmed by a provider.`,
      },
    ],
  },
];

export function getBoroughServiceContent(serviceSlug: string): BoroughServiceContent | null {
  return boroughServiceContent.find((s) => s.slug === serviceSlug) ?? null;
}
