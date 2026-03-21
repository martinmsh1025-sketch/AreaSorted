import { NextResponse } from "next/server";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/providers/notifications";

export async function POST(request: Request) {
  const companyId = await getProviderSessionCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notificationId, all } = body as { notificationId?: string; all?: boolean };

  if (all) {
    await markAllNotificationsRead(companyId);
  } else if (notificationId) {
    await markNotificationRead(notificationId, companyId);
  } else {
    return NextResponse.json({ error: "Missing notificationId or all flag" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
