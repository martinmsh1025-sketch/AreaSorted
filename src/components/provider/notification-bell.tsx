"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, ShoppingCart, XCircle, Clock, MapPin, CreditCard, Wallet, UserCircle, MessageSquare } from "lucide-react";

/* ── Types ─────────────────────────────────── */

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
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

/* ── Relative time helper ─────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ── Bell Component ───────────────────────── */

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  /* ── Fetch ───────────────────────────────── */

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/provider/notifications?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /* ── Close on outside click ─────────────── */

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  /* ── Mark all read ──────────────────────── */

  async function handleMarkAllRead() {
    try {
      await fetch("/api/provider/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  /* ── Mark single read + navigate ─────────── */

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      try {
        await fetch("/api/provider/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: n.id }),
        });
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border bg-popover shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Bell className="size-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIconMap[n.type] || Bell;
                const content = (
                  <div
                    className={`flex gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !n.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${!n.read ? "text-blue-600" : "text-muted-foreground"}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!n.read ? "font-semibold" : "font-medium"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="mt-1 flex-shrink-0 size-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );

                if (n.link) {
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => handleNotificationClick(n)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={n.id} onClick={() => handleNotificationClick(n)}>
                    {content}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2.5">
            <Link
              href="/provider/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
