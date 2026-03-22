import { NextResponse } from "next/server";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/providers/notifications";

// M-5 FIX: Validate CUID format for notificationId to prevent injection
const CUID_REGEX = /^c[a-z0-9]{20,30}$/;

export async function POST(request: Request) {
  const companyId = await getProviderSessionCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // M-5 FIX: Wrap in try/catch for robust error handling
  try {
    const body = await request.json();
    const { notificationId, all } = body as { notificationId?: string; all?: boolean };

    if (all) {
      await markAllNotificationsRead(companyId);
    } else if (notificationId) {
      // M-5 FIX: Validate notificationId format before passing to DB
      if (typeof notificationId !== "string" || !CUID_REGEX.test(notificationId)) {
        return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
      }
      await markNotificationRead(notificationId, companyId);
    } else {
      return NextResponse.json({ error: "Missing notificationId or all flag" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notifications/mark-read] Error:", error instanceof Error ? error.message : "Unknown error");
    }
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
