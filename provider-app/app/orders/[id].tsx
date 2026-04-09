import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/state/auth";
import {
  getProviderMobileOrder,
  requestProviderMobileOrderSupport,
  updateProviderMobileOrder,
  type MobileProviderOrderDetail,
} from "@/lib/provider-api";
import { mobileConfig } from "@/lib/config";
import { mockOrderDetails } from "@/data/mock-provider";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";
import {
  canAcceptOrder,
  canCompleteOrder,
  canStartOrder,
  formatBookingStatus,
  formatDate,
  formatPropertyType,
  formatServiceType,
} from "@/lib/provider-format";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<MobileProviderOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");

  const loadOrder = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      if (mobileConfig.demoMode) {
        const demoOrder = mockOrderDetails[id as keyof typeof mockOrderDetails];
        if (!demoOrder) {
          throw new Error("Demo order not found.");
        }
        setOrder(demoOrder);
        return;
      }
      const response = await getProviderMobileOrder(token, id);
      setOrder(response.order);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load order.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadOrder().catch(() => undefined);
  }, [loadOrder]);

  async function runAction(action: "accept" | "reject" | "start" | "complete") {
    if (!token || !id || saving) return;
    try {
      setSaving(true);
      if (mobileConfig.demoMode) {
        setOrder((current) => {
          if (!current) return current;
          const nextStatus = action === "accept"
            ? "ASSIGNED"
            : action === "reject"
              ? "NO_CLEANER_FOUND"
              : action === "start"
                ? "IN_PROGRESS"
                : "COMPLETED";
          return { ...current, bookingStatus: nextStatus };
        });
        return;
      }
      await updateProviderMobileOrder(token, id, action, action === "reject" ? "Declined in provider app" : undefined);
      await loadOrder();
    } catch (actionError) {
      Alert.alert("Action failed", actionError instanceof Error ? actionError.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function sendSupportRequest() {
    if (!token || !id || saving) return;
    try {
      setSaving(true);
      if (mobileConfig.demoMode) {
        Alert.alert("Support updated", "Demo support request recorded locally.");
        setSupportMessage("");
        return;
      }
      const response = await requestProviderMobileOrderSupport(token, id, {
        requestType: "ISSUE",
        message: supportMessage,
      });
      Alert.alert("Support updated", response.message);
      setSupportMessage("");
    } catch (supportError) {
      Alert.alert("Support request failed", supportError instanceof Error ? supportError.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Text style={AppTheme.text.bodyMuted}>Loading order...</Text>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <Text style={AppTheme.text.bodyMuted}>{error || "Order not found."}</Text>
      </Screen>
    );
  }

  const address = [order.serviceAddressLine1, order.serviceAddressLine2, order.serviceCity, order.servicePostcode]
    .filter(Boolean)
    .join(", ");
  const timeSlot = order.scheduledEndTime ? `${order.scheduledStartTime} - ${order.scheduledEndTime}` : order.scheduledStartTime;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ gap: 14 }}>
          <Card tone="hero">
            <Text style={AppTheme.text.eyebrow}>Order detail</Text>
            <Text style={AppTheme.text.heroTitle}>{formatServiceType(order.serviceType)}</Text>
            <Text style={AppTheme.text.heroBody}>{order.scheduledDateLabel} at {timeSlot}</Text>
            <View style={{ marginTop: 10, alignSelf: "flex-start" }}>
              <Pill label={formatBookingStatus(order.bookingStatus)} subtle={order.bookingStatus !== "PENDING_ASSIGNMENT"} />
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Quick snapshot</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <Text style={AppTheme.text.body}>Scheduled: {formatDate(order.scheduledDate)} at {timeSlot}</Text>
              <Text style={AppTheme.text.body}>Total paid by customer: {order.totalAmountLabel}</Text>
              <Text style={AppTheme.text.body}>Expected payout: {order.providerExpectedPayoutLabel}</Text>
              <Text style={AppTheme.text.body}>Platform fee: {order.platformFeeAmountLabel}</Text>
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Customer and address</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <Text style={AppTheme.text.body}>{order.customer?.name || "Customer"}</Text>
              <Text style={AppTheme.text.bodyMuted}>{order.customer?.email || "No email"}</Text>
              <Text style={AppTheme.text.bodyMuted}>{order.customer?.phone || "No phone"}</Text>
              <Text style={AppTheme.text.body}>{address}</Text>
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Job summary</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <Text style={AppTheme.text.body}>Property: {formatPropertyType(order.propertyType)}</Text>
              <Text style={AppTheme.text.body}>Bedrooms: {order.bedroomCount ?? 0}</Text>
              <Text style={AppTheme.text.body}>Bathrooms: {order.bathroomCount ?? 0}</Text>
              <Text style={AppTheme.text.body}>Supplies: {order.customerProvidesSupplies ? "Customer provides supplies" : "Provider supplies"}</Text>
              <Text style={AppTheme.text.body}>Payout: {order.providerExpectedPayoutLabel}</Text>
              <Text style={AppTheme.text.body}>Platform fee: {order.platformFeeAmountLabel}</Text>
              <Text style={AppTheme.text.body}>Notes: {order.additionalNotes || "No additional notes."}</Text>
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Actions</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {canAcceptOrder(order.bookingStatus) ? (
                <>
                  <ActionButton label="Accept order" onPress={() => runAction("accept")} disabled={saving} />
                  <ActionButton label="Decline order" onPress={() => runAction("reject")} disabled={saving} tone="secondary" />
                </>
              ) : null}
              {canStartOrder(order.bookingStatus) ? (
                <ActionButton label="Start job" onPress={() => runAction("start")} disabled={saving} />
              ) : null}
              {canCompleteOrder(order.bookingStatus) ? (
                <ActionButton label="Complete job" onPress={() => runAction("complete")} disabled={saving} />
              ) : null}
              {!canAcceptOrder(order.bookingStatus) && !canStartOrder(order.bookingStatus) && !canCompleteOrder(order.bookingStatus) ? (
                <Text style={AppTheme.text.caption}>No direct action available for this order status.</Text>
              ) : null}
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Need support?</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              <TextInput
                multiline
                value={supportMessage}
                onChangeText={setSupportMessage}
                placeholder="Explain the issue, reschedule need, or anything support should know."
                placeholderTextColor={AppTheme.colors.muted}
                style={{
                  minHeight: 110,
                  borderWidth: 1,
                  borderColor: AppTheme.colors.line,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: "#fff",
                  color: AppTheme.colors.ink,
                  textAlignVertical: "top",
                }}
              />
              <ActionButton label="Send to support" onPress={sendSupportRequest} disabled={saving || supportMessage.trim().length < 10} tone="secondary" />
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: tone === "primary" ? AppTheme.colors.ink : AppTheme.colors.accentSoft,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 15,
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: tone === "primary" ? "#fff" : AppTheme.colors.ink, fontSize: 15, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
