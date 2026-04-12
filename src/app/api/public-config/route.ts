import { NextResponse } from "next/server";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

export async function GET() {
  try {
    const enabledServiceValues = await getEnabledServiceValues();
    return NextResponse.json({ enabledServiceValues });
  } catch {
    return NextResponse.json(
      { error: "Failed to load service configuration" },
      { status: 500 }
    );
  }
}
