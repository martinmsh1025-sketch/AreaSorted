import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

export function NotificationCoordinator() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        path?: string;
        bookingId?: string;
      };

      if (typeof data.path === "string" && data.path.startsWith("/")) {
        router.push(data.path as never);
        return;
      }

      if (typeof data.bookingId === "string" && data.bookingId) {
        router.push(`/orders/${data.bookingId}` as never);
        return;
      }

      router.push("/(tabs)/notifications" as never);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}
