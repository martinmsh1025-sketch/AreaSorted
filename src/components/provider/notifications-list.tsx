"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  Wallet,
  UserCircle,
  MessageSquare,
  Check,
} from "lucide-react";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/provider/notifications/actions";

/* ── Types ─────────────────────────────────── */

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

/* ── Icon per notification type ────────────── */

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  NEW_ORDER: ShoppingCart,
  ORDER_CANCELLED: XCircle,
  ORDER_REMINDER: Clock,
  COVERAGE_APPROVED: MapPin,
  COVERAGE_REJECTED: MapPin,
  PAYMENT_RECEIVED: CreditCard,
  PAYOUT_SENT: Wallet,
  PROFILE_UPDATE: UserCircle,
  SYSTEM_MESSAGE: MessageSquare,
};

const typeLabelMap: Record<string, string> = {
  NEW_ORDER: "New Order",
  ORDER_CANCELLED: "Order Cancelled",
  ORDER_REMINDER: "Reminder",
  COVERAGE_APPROVED: "Coverage Approved",
  COVERAGE_REJECTED: "Coverage Rejected",
  PAYMENT_RECEIVED: "Payment",
  PAYOUT_SENT: "Payout",
  PROFILE_UPDATE: "Profile",
  SYSTEM_MESSAGE: "System",
};

/* ── Date formatter ───────────────────────── */

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  });
}

/* ── Component ────────────────────────────── */

interface NotificationsListProps {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationsList({ notifications: initialNotifications, unreadCount: initialUnread }: NotificationsListProps) {
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [unreadCount, setUnreadCount] = React.useState(initialUnread);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = React.useState(false);

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === "all" ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === "unread" ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="size-4" />
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-lg border divide-y">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="size-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const Icon = typeIconMap[n.type] || Bell;
            const typeLabel = typeLabelMap[n.type] || n.type;

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 transition-colors ${
                  !n.read ? "bg-blue-50/50" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex items-center justify-center rounded-lg size-9 flex-shrink-0 ${
                    !n.read
                      ? "bg-blue-100 text-blue-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground/70">{formatDate(n.createdAt)}</span>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="rounded p-1 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {typeLabel}
                    </span>
                    {n.link && (
                      <Link
                        href={n.link}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
