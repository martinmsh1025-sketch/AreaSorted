import { Pressable, ScrollView, Text, View } from "react-native";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { useProviderOrders } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";
import { StatRow } from "@/ui/stat-row";
import { formatBookingStatus, formatServiceType } from "@/lib/provider-format";

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading, error } = useProviderOrders();

  const metrics = useMemo(() => {
    const open = orders.filter((order) => order.bookingStatus === "PENDING_ASSIGNMENT").length;
    const today = orders.filter((order) => order.scheduledDateLabel.includes("Today")).length;
    const live = orders.filter((order) => order.bookingStatus === "IN_PROGRESS").length;
    return { open, today, live };
  }, [orders]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ gap: 16 }}>
          <Card tone="hero">
            <Text style={AppTheme.text.eyebrow}>AreaSorted Provider</Text>
            <Text style={AppTheme.text.heroTitle}>Manage jobs faster on mobile.</Text>
            <Text style={AppTheme.text.heroBody}>
              This MVP focuses on the daily provider loop: new work, reminders, availability, and account status.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pill label={`${metrics.open} awaiting response`} />
              <Pill label={`${metrics.live} live`} subtle />
            </View>
          </Card>

          <StatRow
            stats={[
              { label: "Pending", value: String(metrics.open) },
              { label: "Today", value: String(metrics.today) },
              { label: "Live", value: String(metrics.live) },
            ]}
          />

          <View style={{ gap: 12 }}>
            <Text style={AppTheme.text.sectionTitle}>Upcoming orders</Text>
            {loading ? <Text style={AppTheme.text.caption}>Refreshing orders...</Text> : null}
            {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error} Showing fallback preview data.</Text> : null}
            {orders.map((order) => (
              <Pressable key={order.id} onPress={() => router.push(`/orders/${order.id}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={AppTheme.text.cardTitle}>{formatServiceType(order.serviceType)}</Text>
                    <Text style={AppTheme.text.body}>{order.customer?.name || "Customer"}</Text>
                    <Text style={AppTheme.text.caption}>{order.scheduledDateLabel} at {order.scheduledStartTime} - {order.servicePostcode}</Text>
                  </View>
                  <Pill label={formatBookingStatus(order.bookingStatus)} subtle={order.bookingStatus !== "PENDING_ASSIGNMENT"} />
                </View>

                <View style={{ height: 1, backgroundColor: AppTheme.colors.line, marginVertical: 14 }} />

                <View style={{ gap: 8 }}>
                  <Text style={AppTheme.text.meta}>Payout {order.providerExpectedPayoutLabel}</Text>
                  <Text style={AppTheme.text.body}>{order.additionalNotes || "No additional notes."}</Text>
                </View>
              </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
