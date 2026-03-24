function getSafeBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://areasorted.com";

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://areasorted.com";
  }
}

export async function GET() {
  const baseUrl = getSafeBaseUrl();

  const content = [
    "# AreaSorted",
    "",
    "> AreaSorted is a London-based local services marketplace for cleaning, pest control, handyman work, furniture assembly, waste removal, and garden maintenance.",
    "",
    "## Summary",
    "- Covers all 32 London boroughs",
    "- Provides postcode-first coverage checks before booking",
    "- Uses transparent quote breakdowns with pricing shown before checkout",
    "- Uses a temporary card hold and captures payment only after booking confirmation",
    "- Works with vetted independent service providers",
    "",
    "## Key Pages",
    `- Home: ${baseUrl}/`,
    `- Services: ${baseUrl}/services`,
    `- How It Works: ${baseUrl}/how-it-works`,
    `- Pricing: ${baseUrl}/pricing`,
    `- FAQ: ${baseUrl}/faq`,
    `- London Coverage: ${baseUrl}/london`,
    `- Cleaning Services: ${baseUrl}/services/cleaning`,
    `- Handyman Services: ${baseUrl}/services/handyman`,
    `- Pest Control Services: ${baseUrl}/services/pest-control`,
    `- Furniture Assembly Services: ${baseUrl}/services/furniture-assembly`,
    `- Waste Removal Services: ${baseUrl}/services/waste-removal`,
    `- Garden Maintenance Services: ${baseUrl}/services/garden-maintenance`,
    `- Contact: ${baseUrl}/contact`,
    "",
    "## Customer Booking Flow",
    "1. Enter a London postcode to check coverage",
    "2. Select the service and job details",
    "3. Review a quote with pricing breakdown",
    "4. Continue securely with a temporary card hold",
    "5. Booking is confirmed before payment is captured",
    "",
    "## Notes",
    "- Public marketing and information pages are intended to be indexed",
    "- Account, admin, provider, quote, booking, and API routes are not intended for search indexing",
    "- Sitemap is available at /sitemap.xml",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
