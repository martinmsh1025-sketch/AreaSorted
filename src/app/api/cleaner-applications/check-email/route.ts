import { NextRequest, NextResponse } from "next/server";
import { cleanerApplicationEmailExists } from "@/lib/cleaner-application-store";
import { cleanerRecordEmailExists } from "@/lib/cleaner-record-store";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "";

  if (!email) {
    return NextResponse.json({ exists: false });
  }

  const exists = (await cleanerApplicationEmailExists(email)) || (await cleanerRecordEmailExists(email));
  return NextResponse.json({ exists });
}
