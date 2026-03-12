import { NextResponse } from "next/server";

const API_BASE_URL = "https://api.simplylookupadmin.co.uk/full_v3/getselectedaddress";

export async function GET(request: Request) {
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
      return NextResponse.json({ error: data.licenseStatus || "Unable to fetch selected address." }, { status: 502 });
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
