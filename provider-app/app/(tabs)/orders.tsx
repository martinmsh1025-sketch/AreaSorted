import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useProviderOrders } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card, CardEmpty } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";
import { StatRow } from "@/ui/stat-row";
import { formatBookingStatus, formatServiceType } from "@/lib/provider-format";

const STATUS_FILTERS = [
  { label: "All", value: null },
  { label: "Pending", value: "PENDING_ASSIGNMENT" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading, error, refresh } = useProviderOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  const metrics = useMemo(() => {
    const open = orders.filter((order) => order.bookingStatus === "PENDING_ASSIGNMENT").length;
    const today = orders.filter((order) => order.scheduledDateLabel.includes("Today")).length;
    const live = orders.filter((order) => order.bookingStatus === "IN_PROGRESS").length;
    return { open, today, live };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter) {
      result = result.filter((order) => order.bookingStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((order) =>
        formatServiceType(order.serviceType).toLowerCase().includes(q) ||
        (order.customer?.name || "").toLowerCase().includes(q) ||
        order.servicePostcode.toLowerCase().includes(q) ||
        (order.additionalNotes || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, search]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.colors.ink} />}>
        <View style={{ gap: 16 }}>
          <Card tone="hero">
            <Text style={AppTheme.text.eyebrow}>AreaSorted Provider</Text>
            <Text style={AppTheme.text.heroTitle}>Manage jobs faster on mobile.</Text>
            <Text style={AppTheme.text.heroBody}>
              View incoming work, respond to orders, and track your daily schedule.
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

          {/* Search */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by customer, postcode, service..."
            placeholderTextColor={AppTheme.colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              borderWidth: 1,
              borderColor: AppTheme.colors.line,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: "#fff",
              color: AppTheme.colors.ink,
              fontSize: 14,
            }}
          />

          {/* Status filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.value;
                return (
                  <Pressable
                    key={filter.label}
                    onPress={() => setStatusFilter(active ? null : filter.value)}
                    style={{
                      backgroundColor: active ? AppTheme.colors.ink : "#fff",
                      borderWidth: 1,
                      borderColor: active ? AppTheme.colors.ink : AppTheme.colors.line,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: active ? "#fff" : AppTheme.colors.ink, fontSize: 13, fontWeight: "600" }}>{filter.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ gap: 12 }}>
            <Text style={AppTheme.text.sectionTitle}>
              {statusFilter ? `${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label} orders` : "All orders"}
              {search.trim() ? ` matching "${search.trim()}"` : ""}
            </Text>
            {loading ? <Text style={AppTheme.text.caption}>Refreshing orders...</Text> : null}
            {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error} Showing fallback preview data.</Text> : null}

            {filteredOrders.length === 0 && !loading ? (
              <CardEmpty title="No orders found" body={search.trim() || statusFilter ? "Try adjusting your search or filter." : "New orders will appear here when they are assigned to you."} />
            ) : null}

            {filteredOrders.map((order) => (
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
