import { NextResponse } from "next/server";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import {
  getProviderNotifications,
  getProviderUnreadCount,
} from "@/lib/providers/notifications";

export async function GET(request: Request) {
  try {
    const companyId = await getProviderSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // M-6 FIX: Clamp limit to max 100 to prevent excessive DB queries
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) ? rawLimit : 20));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const [notifications, unreadCount] = await Promise.all([
      getProviderNotifications(companyId, { limit, unreadOnly }),
      getProviderUnreadCount(companyId),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}
