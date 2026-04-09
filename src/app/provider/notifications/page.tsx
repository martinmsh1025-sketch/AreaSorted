import { requireProviderSession } from "@/lib/provider-auth";
import {
  getProviderNotifications,
  getProviderUnreadCount,
} from "@/lib/providers/notifications";
import { NotificationsList } from "@/components/provider/notifications-list";
import { Bell, Inbox } from "lucide-react";

export default async function ProviderNotificationsPage() {
  const session = await requireProviderSession();
  const companyId = session.providerCompany.id;

  const [notifications, unreadCount] = await Promise.all([
    getProviderNotifications(companyId, { limit: 100 }),
    getProviderUnreadCount(companyId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Bell className="size-5 text-[#c62828]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up"}
            </p>
          </div>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c62828]">
        <Inbox className="size-3.5" />
        Updates and alerts
      </div>

      <NotificationsList
        notifications={JSON.parse(JSON.stringify(notifications))}
        unreadCount={unreadCount}
      />
    </div>
  );
}
