import { NextResponse } from "next/server";
import { checkRateLimit, POSTCODE_RATE_LIMIT } from "@/lib/security/rate-limit";

const API_BASE_URL = "https://api.simplylookupadmin.co.uk/full_v3/getselectedaddress";

export async function GET(request: Request) {
  // M-10 FIX: Rate limit postcode address requests
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = checkRateLimit(POSTCODE_RATE_LIMIT, ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const apiKey = process.env.SIMPLY_POSTCODE_API_KEY;
  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get("id")?.trim();

  if (!apiKey) {
    return NextResponse.json({
      error: "Address lookup is not configured right now. Please use manual address entry.",
    });
  }

  if (!lineId) {
    return NextResponse.json({ error: "Missing address line id." }, { status: 400 });
  }

  const upstreamUrl = `${API_BASE_URL}?data_api_Key=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(lineId)}`;

  try {
    const response = await fetch(upstreamUrl, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok || data.error || !data.found) {
      // M-4 FIX: Don't forward upstream error messages (like licenseStatus) to client
      if (process.env.NODE_ENV !== "production") {
        console.error("[postcode-address] Upstream error:", data.licenseStatus || data.error || `HTTP ${response.status}`);
      }
      return NextResponse.json({ error: "Unable to fetch selected address. Please try again." }, { status: 502 });
    }

    return NextResponse.json({
      address: {
        organisation: data.organisation,
        line1: data.line1,
        line2: data.line2,
        line3: data.line3,
        town: data.town,
        county: data.county,
        postcode: data.postcode,
        country: data.country,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to fetch selected address." }, { status: 502 });
  }
}
