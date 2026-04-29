import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { useProviderNotifications } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card, CardEmpty } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, error, markAllRead, markOneRead, refresh } = useProviderNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  function handlePress(item: (typeof notifications)[number]) {
    if (!item.read) {
      markOneRead(item.id).catch(() => undefined);
    }
    if (item.bookingId) {
      router.push(`/orders/${item.bookingId}`);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.colors.ink} />}>
        <View style={{ gap: 12 }}>
          <Text style={AppTheme.text.pageTitle}>Alerts and updates</Text>
          <Text style={AppTheme.text.bodyMuted}>
            Priority messages, new work prompts, and ops reminders.
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={AppTheme.text.caption}>{unreadCount} unread</Text>
            <Text onPress={() => markAllRead().catch(() => undefined)} style={{ color: AppTheme.colors.ink, fontSize: 13, fontWeight: "700" }}>
              Mark all read
            </Text>
          </View>
          {loading ? <Text style={AppTheme.text.caption}>Refreshing notifications...</Text> : null}
          {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error} Showing fallback preview data.</Text> : null}

          {notifications.length === 0 && !loading ? (
            <CardEmpty title="No notifications" body="New alerts and updates will appear here." />
          ) : null}

          {notifications.map((item) => (
            <Pressable key={item.id} onPress={() => handlePress(item)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={AppTheme.text.cardTitle}>{item.title}</Text>
                    <Text style={AppTheme.text.body}>{item.message}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={AppTheme.text.caption}>{item.createdAtLabel}</Text>
                      {item.bookingId ? <Text style={{ fontSize: 12, color: AppTheme.colors.accent, fontWeight: "600" }}>View order</Text> : null}
                    </View>
                  </View>
                  <Pill label={item.read ? "Read" : "New"} subtle={item.read} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
