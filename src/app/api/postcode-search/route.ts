import { NextResponse } from "next/server";

const API_BASE_URL = "https://api.simplylookupadmin.co.uk/full_v3/getaddresslist";

export async function GET(request: Request) {
  const apiKey = process.env.SIMPLY_POSTCODE_API_KEY;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: "Missing SIMPLY_POSTCODE_API_KEY." }, { status: 500 });
  }

  if (!query) {
    return NextResponse.json({ error: "Missing postcode query." }, { status: 400 });
  }

  const upstreamUrl = `${API_BASE_URL}?data_api_Key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(upstreamUrl, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok || data.errormessage) {
      return NextResponse.json({ error: data.errormessage || "Unable to fetch addresses." }, { status: 502 });
    }

    return NextResponse.json({
      results: data.results ?? [],
      instructionsTxt: data.instructionsTxt ?? "Choose your address from the list.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to fetch addresses." }, { status: 502 });
  }
}
