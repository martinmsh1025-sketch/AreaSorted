import { NextRequest, NextResponse } from "next/server";
import { requireMobileProviderAccountSession } from "@/lib/provider-mobile-auth";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/providers/notifications";

const CUID_REGEX = /^c[a-z0-9]{20,30}$/;

export async function POST(request: NextRequest) {
  try {
    const session = await requireMobileProviderAccountSession(request);
    const body = await request.json();
    const notificationId = body?.notificationId ? String(body.notificationId) : "";
    const all = Boolean(body?.all);

    if (all) {
      await markAllNotificationsRead(session.providerCompany.id);
    } else if (notificationId) {
      if (!CUID_REGEX.test(notificationId)) {
        return NextResponse.json({ error: "Invalid notification ID." }, { status: 400 });
      }
      await markNotificationRead(notificationId, session.providerCompany.id);
    } else {
      return NextResponse.json({ error: "Missing notification target." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }
}
