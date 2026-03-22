import { NextResponse } from "next/server";
import { normalisePostcode } from "@/lib/postcode-coverage";
import { checkRateLimit, POSTCODE_RATE_LIMIT } from "@/lib/security/rate-limit";

const API_BASE_URL = "https://api.simplylookupadmin.co.uk/full_v3/getaddresslist";

type LookupResult = {
  ID?: string;
  id?: string;
  Line?: string;
  line?: string;
};

function normaliseResults(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const result = item as LookupResult;
      const id = result.ID || result.id || "";
      const line = result.Line || result.line || "";

      if (!id || !line) return null;

      return { ID: id, Line: line };
    })
    .filter((item): item is { ID: string; Line: string } => Boolean(item));
}

export async function GET(request: Request) {
  // M-10 FIX: Rate limit postcode search requests
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
  const rawQuery = searchParams.get("query")?.trim();
  const query = rawQuery ? normalisePostcode(rawQuery) : "";

  if (!apiKey) {
    return NextResponse.json({
      results: [],
      instructionsTxt: "Address lookup is not configured right now. Please use manual address entry.",
      disabled: true,
    });
  }

  if (!query) {
    return NextResponse.json({ error: "Missing postcode query." }, { status: 400 });
  }

  const upstreamUrl = `${API_BASE_URL}?data_api_Key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok || data.errormessage || data.processResult === false) {
      // M-4 FIX: Don't forward upstream error messages to client
      if (process.env.NODE_ENV !== "production") {
        console.error("[postcode-search] Upstream error:", data.errormessage || `HTTP ${response.status}`);
      }
      return NextResponse.json({ error: "Unable to fetch addresses. Please try again." }, { status: 502 });
    }

    return NextResponse.json({
      results: normaliseResults(data.results ?? data.Results),
      instructionsTxt: data.instructionsTxt ?? "Choose your address from the list.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to fetch addresses." }, { status: 502 });
  }
}
