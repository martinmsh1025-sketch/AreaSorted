import { ScrollView, Text, View } from "react-native";
import { useProviderPayouts } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { Screen } from "@/ui/screen";
import { StatRow } from "@/ui/stat-row";
import { formatBookingStatus, formatDate, formatMoney } from "@/lib/provider-format";

export default function PayoutsScreen() {
  const { totals, payouts, loading, error } = useProviderPayouts();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
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

          {loading ? <Text style={AppTheme.text.caption}>Refreshing payouts...</Text> : null}
          {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error} Showing fallback preview data.</Text> : null}

          {payouts.map((payout) => (
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
