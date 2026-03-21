import { getPrisma } from "@/lib/db";
import type { ProviderNotificationType } from "@prisma/client";

/* ── Create a notification ────────────────── */

interface CreateNotificationInput {
  providerCompanyId: string;
  type: ProviderNotificationType;
  title: string;
  message: string;
  link?: string;
  bookingId?: string;
}

export async function createProviderNotification(input: CreateNotificationInput) {
  const prisma = getPrisma();
  return prisma.providerNotification.create({
    data: {
      providerCompanyId: input.providerCompanyId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      bookingId: input.bookingId ?? null,
    },
  });
}

/* ── Fetch notifications ──────────────────── */

export async function getProviderNotifications(
  providerCompanyId: string,
  opts?: { limit?: number; unreadOnly?: boolean }
) {
  const prisma = getPrisma();
  const limit = opts?.limit ?? 50;

  return prisma.providerNotification.findMany({
    where: {
      providerCompanyId,
      ...(opts?.unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/* ── Unread count ─────────────────────────── */

export async function getProviderUnreadCount(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerNotification.count({
    where: { providerCompanyId, read: false },
  });
}

/* ── Mark single notification as read ─────── */

export async function markNotificationRead(notificationId: string, providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerNotification.updateMany({
    where: { id: notificationId, providerCompanyId },
    data: { read: true, readAt: new Date() },
  });
}

/* ── Mark all notifications as read ───────── */

export async function markAllNotificationsRead(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerNotification.updateMany({
    where: { providerCompanyId, read: false },
    data: { read: true, readAt: new Date() },
  });
}
