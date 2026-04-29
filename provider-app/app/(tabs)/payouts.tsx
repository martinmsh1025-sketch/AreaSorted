import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useProviderPayouts } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card, CardEmpty } from "@/ui/card";
import { Screen } from "@/ui/screen";
import { StatRow } from "@/ui/stat-row";
import { formatBookingStatus, formatDate, formatMoney } from "@/lib/provider-format";

const PAYOUT_FILTERS = [
  { label: "All", value: null },
  { label: "On hold", value: "ON_HOLD" },
  { label: "Eligible", value: "ELIGIBLE" },
  { label: "Released", value: "RELEASED" },
  { label: "Paid", value: "PAID" },
  { label: "Blocked", value: "BLOCKED" },
] as const;

export default function PayoutsScreen() {
  const { totals, payouts, loading, error, refresh } = useProviderPayouts();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  const filteredPayouts = useMemo(() => {
    if (!statusFilter) return payouts;
    return payouts.filter((p) => p.status === statusFilter);
  }, [payouts, statusFilter]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.colors.ink} />}>
        <View style={{ gap: 14 }}>
          <Text style={AppTheme.text.pageTitle}>Payouts</Text>
          <Text style={AppTheme.text.bodyMuted}>
            Track earnings on hold, ready for release, and already paid out.
          </Text>

          <StatRow
            stats={[
              { label: "On hold", value: formatMoney(totals.onHold) },
              { label: "Eligible", value: formatMoney(totals.eligible) },
              { label: "Released", value: formatMoney(totals.released) },
            ]}
          />

          {/* Status filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {PAYOUT_FILTERS.map((filter) => {
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

          {loading ? <Text style={AppTheme.text.caption}>Refreshing payouts...</Text> : null}
          {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error} Showing fallback preview data.</Text> : null}

          {filteredPayouts.length === 0 && !loading ? (
            <CardEmpty title="No payouts" body={statusFilter ? "No payouts match this filter." : "Payouts will appear here after completed jobs."} />
          ) : null}

          {filteredPayouts.map((payout) => (
            <Card key={payout.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={AppTheme.text.cardTitle}>{payout.bookingReference}</Text>
                  <Text style={AppTheme.text.body}>{payout.bookingStatus ? formatBookingStatus(payout.bookingStatus) : "Booking"}</Text>
                  <Text style={AppTheme.text.caption}>Scheduled {formatDate(payout.scheduledDate)}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={AppTheme.text.meta}>{payout.amountLabel}</Text>
                  <Text style={AppTheme.text.caption}>{payout.status.replace(/_/g, " ")}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: AppTheme.colors.line, marginVertical: 14 }} />

              <View style={{ gap: 6 }}>
                <Text style={AppTheme.text.body}>Hold until: {formatDate(payout.holdUntil)}</Text>
                <Text style={AppTheme.text.body}>Available on: {formatDate(payout.availableOn)}</Text>
                <Text style={AppTheme.text.body}>Released: {formatDate(payout.releasedAt)}</Text>
                <Text style={AppTheme.text.body}>Paid: {formatDate(payout.paidAt)}</Text>
                {payout.blockedReason ? <Text style={AppTheme.text.body}>Note: {payout.blockedReason}</Text> : null}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
