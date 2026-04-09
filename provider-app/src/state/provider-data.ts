import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProviderMobileAvailability,
  getProviderMobileNotifications,
  getProviderMobileOrders,
  getProviderMobilePayouts,
  markProviderMobileNotifications,
  type MobileProviderAvailabilityDay,
  type MobileProviderAvailabilityOverride,
  type MobileProviderNotification,
  type MobileProviderOrder,
  type MobileProviderPayout,
} from "@/lib/provider-api";
import { mockAvailability, mockNotifications, mockOrders, mockPayouts, mockProviderAccount } from "@/data/mock-provider";
import { useAuth } from "@/state/auth";
import { mobileConfig } from "@/lib/config";

function useProtectedLoader<T>(
  loader: (token: string) => Promise<T>,
  fallback: T,
) {
  const { token } = useAuth();
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || mobileConfig.demoMode) {
      setData(fallback);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextData = await loader(token);
      setData(nextData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [fallback, loader, token]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useProviderOrders() {
  const query = useProtectedLoader(async (token) => {
    const response = await getProviderMobileOrders(token);
    return response.orders;
  }, mockOrders as MobileProviderOrder[]);

  return {
    orders: query.data,
    loading: query.loading,
    error: query.error,
    refresh: query.refresh,
  };
}

export function useProviderNotifications() {
  const { token } = useAuth();
  const fallback = useMemo(() => ({
    notifications: mockNotifications as MobileProviderNotification[],
    unreadCount: mockNotifications.filter((item) => !item.read).length,
  }), []);
  const query = useProtectedLoader(async (activeToken) => getProviderMobileNotifications(activeToken), fallback);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    await markProviderMobileNotifications(token, { all: true });
    await query.refresh();
  }, [query, token]);

  return {
    notifications: query.data.notifications,
    unreadCount: query.data.unreadCount,
    loading: query.loading,
    error: query.error,
    refresh: query.refresh,
    markAllRead,
  };
}

export function useProviderAvailability() {
  const fallback = useMemo(() => ({
    schedule: mockAvailability.schedule as MobileProviderAvailabilityDay[],
    overrides: mockAvailability.overrides as MobileProviderAvailabilityOverride[],
    settings: {
      maxJobsPerDay: null,
      leadTimeHours: 24,
    },
  }), []);
  const query = useProtectedLoader(async (token) => getProviderMobileAvailability(token), fallback);

  return {
    schedule: query.data.schedule,
    overrides: query.data.overrides,
    settings: query.data.settings,
    loading: query.loading,
    error: query.error,
    refresh: query.refresh,
  };
}

export function useProviderAccount() {
  const { provider } = useAuth();
  if (!provider) {
    return mockProviderAccount;
  }

  return {
    displayName: provider.displayName,
    email: provider.contactEmail,
    statusLabel: provider.status,
    coverageSummary: provider.coveragePostcodePrefixes.length
      ? `${provider.coveragePostcodePrefixes.length} postcode prefixes active.`
      : "Coverage not configured yet.",
    pricingSummary: `${provider.activePricingRules} active pricing rules.`,
    payoutSummary: "Payout details remain available in the web portal and can be added next.",
    nextActions: [
      provider.status === "ACTIVE" ? "Review new incoming orders quickly from the Orders tab." : "Complete remaining onboarding steps in the web portal.",
      provider.activePricingRules > 0 ? "Keep your availability updated before peak slots fill up." : "Add pricing rules in the web portal to unlock new bookings.",
      "Push alerts are scaffolded and can be activated with an EAS project for store builds.",
    ],
  };
}

export function useProviderPayouts() {
  const fallback = useMemo(() => mockPayouts as { totals: { onHold: number; eligible: number; released: number }; payouts: MobileProviderPayout[] }, []);
  const query = useProtectedLoader(async (token) => getProviderMobilePayouts(token), fallback);

  return {
    totals: query.data.totals,
    payouts: query.data.payouts,
    loading: query.loading,
    error: query.error,
    refresh: query.refresh,
  };
}
