"use server";

import { requireProviderSession } from "@/lib/provider-auth";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/providers/notifications";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireProviderSession();
  await markNotificationRead(notificationId, session.providerCompany.id);
  revalidatePath("/provider/notifications");
}

export async function markAllNotificationsReadAction() {
  const session = await requireProviderSession();
  await markAllNotificationsRead(session.providerCompany.id);
  revalidatePath("/provider/notifications");
}
