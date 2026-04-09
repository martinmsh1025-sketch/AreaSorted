import { ScrollView, Text, View } from "react-native";
import { useProviderNotifications } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, error, markAllRead } = useProviderNotifications();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ gap: 12 }}>
          <Text style={AppTheme.text.pageTitle}>Alerts and updates</Text>
          <Text style={AppTheme.text.bodyMuted}>
            Priority messages, new work prompts, and ops reminders would land here.
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={AppTheme.text.caption}>{unreadCount} unread</Text>
            <Text onPress={() => markAllRead().catch(() => undefined)} style={{ color: AppTheme.colors.ink, fontSize: 13, fontWeight: "700" }}>
              Mark all read
            </Text>
          </View>
          {loading ? <Text style={AppTheme.text.caption}>Refreshing notifications...</Text> : null}
          {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error} Showing fallback preview data.</Text> : null}

          {notifications.map((item) => (
            <Card key={item.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={AppTheme.text.cardTitle}>{item.title}</Text>
                  <Text style={AppTheme.text.body}>{item.message}</Text>
                  <Text style={AppTheme.text.caption}>{item.createdAtLabel}</Text>
                </View>
                <Pill label={item.read ? "Read" : "New"} subtle={item.read} />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
