import { requireProviderSession } from "@/lib/provider-auth";
import {
  getProviderNotifications,
  getProviderUnreadCount,
} from "@/lib/providers/notifications";
import { NotificationsList } from "@/components/provider/notifications-list";
import { Bell } from "lucide-react";

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
          <Bell className="size-6 text-blue-600" />
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

      <NotificationsList
        notifications={JSON.parse(JSON.stringify(notifications))}
        unreadCount={unreadCount}
      />
    </div>
  );
}
