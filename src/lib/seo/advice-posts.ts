export type AdvicePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readTime: string;
  keywords: string[];
  intro: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
};

export const advicePosts: AdvicePost[] = [
  {
    slug: "how-much-does-cleaning-cost-in-london",
    title: "How Much Does Cleaning Cost in London?",
    description:
      "Understand what affects cleaning prices in London, from property size and condition to timing, add-ons, and postcode-related adjustments.",
    category: "Pricing",
    publishedAt: "2026-03-25",
    readTime: "5 min read",
    keywords: ["cleaning cost london", "cleaner prices london", "domestic cleaning pricing"],
    intro:
      "Cleaning prices in London are rarely one flat number. Property size, condition, access, timing, and the exact type of clean all change the final quote, so customers should expect a pricing range rather than one universal rate.",
    sections: [
      {
        title: "What affects the final cleaning quote",
        paragraphs: [
          "The biggest factor is the type of clean. A weekly home clean, an end of tenancy clean, and an appliance deep clean all require different time, supplies, and job setup.",
          "Property size matters too. A one-bedroom flat and a four-bedroom house can fall into very different time bands, especially once bathrooms, kitchens, and add-ons are included.",
        ],
        bullets: [
          "Property size and property type",
          "Cleaning condition and level of work required",
          "Urgency, weekend, and evening timing",
          "Postcode and travel-related adjustments",
          "Extras such as oven, carpet, or inside-window cleaning",
        ],
      },
      {
        title: "Why postcode can change the price",
        paragraphs: [
          "Travel and coverage still matter in London. Some postcodes are easier to serve than others, and some booking windows create more travel pressure for providers.",
          "That means two similar cleaning jobs can still price slightly differently depending on where and when they happen.",
        ],
      },
      {
        title: "What customers should expect before booking",
        paragraphs: [
          "A good cleaning quote should show the estimated total before checkout and separate the booking fee clearly. Customers should also know when money is only held temporarily and when it is actually captured.",
          "At AreaSorted, customers can check postcode coverage, review the quote breakdown, and continue only when the price and timing work for them.",
        ],
      },
    ],
  },
  {
    slug: "how-to-prepare-for-end-of-tenancy-cleaning",
    title: "How to Prepare for End of Tenancy Cleaning",
    description:
      "A simple checklist for preparing an end of tenancy clean in London, including access, appliances, photos, and what helps avoid delays on the day.",
    category: "Moving",
    publishedAt: "2026-03-25",
    readTime: "4 min read",
    keywords: ["end of tenancy cleaning checklist", "prepare for move out clean", "tenancy cleaning london"],
    intro:
      "End of tenancy cleaning runs more smoothly when the property is ready before the booking starts. Access issues, leftover items, and unclear appliance requirements are some of the biggest causes of delays.",
    sections: [
      {
        title: "Clear the property first",
        paragraphs: [
          "The cleaner should be able to reach all main surfaces, rooms, and storage areas without working around large piles of belongings.",
          "If furniture, bags, or rubbish remain inside the property, the result can be slower progress and a different cleaning scope than the customer expected.",
        ],
      },
      {
        title: "Confirm appliances and extras",
        paragraphs: [
          "Many move-out cleans need appliance extras such as oven cleaning, fridge cleaning, or internal windows. It helps to confirm these in advance rather than raise them only on the day.",
        ],
        bullets: [
          "Check if oven cleaning is included",
          "Confirm whether fridge or freezer cleaning is needed",
          "Flag any carpet, upholstery, or internal window extras",
        ],
      },
      {
        title: "Make access simple",
        paragraphs: [
          "If keys, concierge access, parking, or building entry rules are involved, set them out clearly before the booking starts. This is especially important for flats, managed buildings, and city-centre move-outs.",
        ],
      },
    ],
  },
  {
    slug: "what-to-check-before-booking-a-handyman-in-london",
    title: "What to Check Before Booking a Handyman in London",
    description:
      "A practical guide to booking handyman work in London, including scope, fittings, access, materials, and how to avoid mismatched job expectations.",
    category: "Handyman",
    publishedAt: "2026-03-25",
    readTime: "5 min read",
    keywords: ["book handyman london", "handyman checklist", "handyman pricing london"],
    intro:
      "Handyman jobs often go wrong before the visit even starts. The most common problems are unclear scope, missing fittings, wall-type surprises, and underestimating how many separate tasks are involved.",
    sections: [
      {
        title: "Define the exact task",
        paragraphs: [
          "Mounting a TV, hanging a mirror, building flat-pack furniture, and replacing fittings all fall under handyman work, but they are not interchangeable. The quote needs the exact task, not just a broad category.",
        ],
      },
      {
        title: "Check fittings and wall conditions",
        paragraphs: [
          "For hanging, mounting, and anchoring jobs, customers should confirm whether they already have the correct brackets, screws, fixings, or anchors. Wall type also matters for the final job time and difficulty.",
        ],
      },
      {
        title: "Bundle tasks carefully",
        paragraphs: [
          "Multiple small jobs can often be combined, but only if they are described clearly at booking stage. A short list helps much more than a vague note saying there are a few extra bits to do.",
        ],
        bullets: [
          "List each task separately",
          "Mention if materials are already on site",
          "Add photos if wall condition or access is unusual",
        ],
      },
    ],
  },
  {
    slug: "how-pest-control-pricing-works-in-london",
    title: "How Pest Control Pricing Works in London",
    description:
      "A practical guide to pest control pricing in London, including inspection-first visits, treatment complexity, reports, and follow-up work.",
    category: "Pest Control",
    publishedAt: "2026-03-26",
    readTime: "4 min read",
    keywords: ["pest control pricing london", "rat treatment cost london", "inspection first pest control"],
    intro:
      "Pest control prices vary more than many customers expect because the issue itself often needs confirming before the right treatment path can be priced properly.",
    sections: [
      {
        title: "Why inspections matter first",
        paragraphs: [
          "Some pest jobs can be quoted directly, but many require an inspection before the final treatment plan is clear. Rodents, insects, and repeat infestations do not always need the same work.",
          "That is why pest control pricing often starts with either a diagnostic visit or an inspection-led booking route.",
        ],
      },
      {
        title: "What affects pest control quotes",
        paragraphs: [
          "Property size, severity, access, treatment type, and whether a written report is needed all affect the final price.",
        ],
        bullets: [
          "Type of pest and urgency",
          "Property layout and access",
          "Need for written report or follow-up",
          "Proofing or repeat treatment requirements",
        ],
      },
      {
        title: "What customers should ask before booking",
        paragraphs: [
          "Customers should confirm whether the job is inspection-first, whether treatment is included in the first visit, and whether follow-up work is commonly required.",
        ],
      },
    ],
  },
  {
    slug: "how-to-book-waste-removal-without-price-surprises",
    title: "How to Book Waste Removal Without Price Surprises",
    description:
      "Learn how volume, access, stairs, and photos affect waste removal quotes in London so you can avoid mismatched collection pricing.",
    category: "Waste Removal",
    publishedAt: "2026-03-26",
    readTime: "4 min read",
    keywords: ["waste removal pricing london", "bulky waste collection quote", "rubbish removal cost london"],
    intro:
      "Waste removal pricing is usually driven by how much needs collecting and how easy it is to load, rather than just the postcode alone.",
    sections: [
      {
        title: "Volume matters more than customers think",
        paragraphs: [
          "A few light bags, a room clearance, and a bulky furniture collection are completely different jobs. The quote needs enough detail to estimate vehicle space, loading time, and labour.",
        ],
      },
      {
        title: "Why photos help",
        paragraphs: [
          "Photos reduce the chance of under-pricing or mismatched collection slots. They also help clarify awkward access, stairs, and the difference between bagged waste and large-item collection.",
        ],
      },
      {
        title: "Common pricing drivers",
        paragraphs: [
          "Customers usually see changes in price when waste jobs involve stairs, awkward loading, heavy items, or more volume than first described.",
        ],
        bullets: [
          "Load size and item count",
          "Stairs, lifts, and parking access",
          "Heavy or awkward items",
          "Special disposal requirements",
        ],
      },
    ],
  },
  {
    slug: "what-customers-should-know-about-temporary-card-holds",
    title: "What Customers Should Know About Temporary Card Holds",
    description:
      "A simple explanation of temporary card holds, when money is captured, and what happens if a provider does not confirm the job.",
    category: "Payments",
    publishedAt: "2026-03-26",
    readTime: "4 min read",
    keywords: ["temporary card hold booking", "when do I get charged", "payment hold before confirmation"],
    intro:
      "Customers often worry that a temporary card hold means they have already been charged. In practice, a hold and a captured payment are not the same thing.",
    sections: [
      {
        title: "What a temporary hold means",
        paragraphs: [
          "A temporary hold reserves the amount while the booking is being confirmed. It is not the same as the final captured payment that appears once the provider confirms the job.",
        ],
      },
      {
        title: "When capture happens",
        paragraphs: [
          "Capture happens after confirmation, not before. That gives customers a structured booking flow while still allowing the platform to protect availability and payment intent during matching.",
        ],
      },
      {
        title: "What happens if the job is not confirmed",
        paragraphs: [
          "If the booking cannot be confirmed, the hold should be released rather than treated as a completed charge. Customers should always be told clearly when a hold is active and when money has actually been taken.",
        ],
      },
    ],
  },
];

export function getAdvicePost(slug: string) {
  return advicePosts.find((post) => post.slug === slug) || null;
}
