import { NextRequest, NextResponse } from "next/server";
import { requireMobileProviderAccountSession } from "@/lib/provider-mobile-auth";
import { removeProviderPushToken, upsertProviderPushToken } from "@/lib/providers/mobile-push-store";

export async function POST(request: NextRequest) {
  try {
    const session = await requireMobileProviderAccountSession(request);
    const body = await request.json();
    const expoPushToken = String(body?.expoPushToken || "").trim();
    const deviceName = body?.deviceName ? String(body.deviceName) : null;
    const platform = body?.platform ? String(body.platform) : null;
    const appVersion = body?.appVersion ? String(body.appVersion) : null;

    if (!expoPushToken.startsWith("ExponentPushToken[") && !expoPushToken.startsWith("ExpoPushToken[")) {
      return NextResponse.json({ error: "Invalid Expo push token." }, { status: 400 });
    }

    const record = await upsertProviderPushToken({
      providerCompanyId: session.providerCompany.id,
      expoPushToken,
      deviceName,
      platform,
      appVersion,
    });

    return NextResponse.json({ ok: true, registration: record });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to register push token." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireMobileProviderAccountSession(request);
    const { searchParams } = new URL(request.url);
    const expoPushToken = String(searchParams.get("expoPushToken") || "").trim();
    if (!expoPushToken) {
      return NextResponse.json({ error: "Push token is required." }, { status: 400 });
    }

    await removeProviderPushToken({
      providerCompanyId: session.providerCompany.id,
      expoPushToken,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to remove push token." }, { status: 500 });
  }
}
