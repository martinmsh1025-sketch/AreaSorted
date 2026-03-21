import { NextResponse } from "next/server";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import {
  getProviderNotifications,
  getProviderUnreadCount,
} from "@/lib/providers/notifications";

export async function GET(request: Request) {
  const companyId = await getProviderSessionCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const [notifications, unreadCount] = await Promise.all([
    getProviderNotifications(companyId, { limit, unreadOnly }),
    getProviderUnreadCount(companyId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
