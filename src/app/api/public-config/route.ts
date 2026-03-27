import { NextResponse } from "next/server";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

export async function GET() {
  const enabledServiceValues = await getEnabledServiceValues();
  return NextResponse.json({ enabledServiceValues });
}
