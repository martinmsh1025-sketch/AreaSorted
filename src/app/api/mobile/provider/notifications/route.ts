import { NextResponse } from "next/server";
import { requireMobileProviderAccountSession } from "@/lib/provider-mobile-auth";
import { getProviderNotifications, getProviderUnreadCount } from "@/lib/providers/notifications";
import { serializeMobileNotification } from "@/lib/providers/mobile-serializers";

export async function GET(request: Request) {
  try {
    const session = await requireMobileProviderAccountSession(request);
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) ? rawLimit : 20));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const [notifications, unreadCount] = await Promise.all([
      getProviderNotifications(session.providerCompany.id, { limit, unreadOnly }),
      getProviderUnreadCount(session.providerCompany.id),
    ]);

    return NextResponse.json({
      notifications: notifications.map((item) => serializeMobileNotification(item)),
      unreadCount,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}
