import { apiRequest } from "@/lib/api";

export type MobileProviderSummary = {
  id: string;
  displayName: string;
  legalName: string | null;
  tradingName: string | null;
  contactEmail: string;
  phone: string | null;
  registeredAddress: string | null;
  vatNumber: string | null;
  status: string;
  headline: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  profileImageType: string | null;
  yearsExperience: number | null;
  memberSince: string;
  approvedAt: string | null;
  serviceCategories: string[];
  coveragePostcodePrefixes: string[];
  activePricingRules: number;
};

export type MobileProviderOrder = {
  id: string;
  serviceType: string;
  servicePostcode: string;
  scheduledDate: string;
  scheduledDateLabel: string;
  scheduledStartTime: string;
  bookingStatus: string;
  totalAmount: number;
  totalAmountLabel: string;
  providerExpectedPayout: number;
  providerExpectedPayoutLabel: string;
  platformFeeAmount: number;
  platformFeeAmountLabel: string;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  additionalNotes: string | null;
};

export type MobileProviderOrderDetail = MobileProviderOrder & {
  serviceAddressLine1: string;
  serviceAddressLine2: string | null;
  serviceCity: string;
  scheduledEndTime: string | null;
  propertyType: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  customerProvidesSupplies: boolean;
};

export type MobileProviderNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  createdAtLabel: string;
  bookingId: string | null;
};

export type MobileProviderAvailabilityDay = {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

export type MobileProviderAvailabilityOverride = {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

export type MobileProviderPayout = {
  id: string;
  bookingId: string;
  bookingReference: string;
  bookingStatus: string | null;
  scheduledDate: string | null;
  status: string;
  amount: number;
  amountLabel: string;
  holdUntil: string | null;
  availableOn: string | null;
  releasedAt: string | null;
  paidAt: string | null;
  blockedReason: string | null;
};

export async function loginProviderMobile(email: string, password: string) {
  return apiRequest<{ token: string; provider: MobileProviderSummary }>("/api/mobile/provider/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function getProviderMobileMe(token: string) {
  return apiRequest<{ provider: MobileProviderSummary; user: { id: string; email: string; isActive: boolean } }>("/api/mobile/provider/me", { token });
}

export async function getProviderMobileOrders(token: string) {
  return apiRequest<{ orders: MobileProviderOrder[] }>("/api/mobile/provider/orders", { token });
}

export async function getProviderMobileOrder(token: string, orderId: string) {
  return apiRequest<{ order: MobileProviderOrderDetail }>(`/api/mobile/provider/orders/${orderId}`, { token });
}

export async function updateProviderMobileOrder(token: string, orderId: string, action: "accept" | "reject" | "start" | "complete", reason?: string) {
  return apiRequest<{ ok: boolean }>(`/api/mobile/provider/orders/${orderId}/decision`, {
    method: "POST",
    token,
    body: { action, reason },
  });
}

export async function requestProviderMobileOrderSupport(
  token: string,
  orderId: string,
  body: { requestType: "RESCHEDULE" | "CANCEL" | "ISSUE"; message: string },
) {
  return apiRequest<{ ok: boolean; message: string }>(`/api/mobile/provider/orders/${orderId}/support`, {
    method: "POST",
    token,
    body,
  });
}

export async function getProviderMobileNotifications(token: string) {
  return apiRequest<{ notifications: MobileProviderNotification[]; unreadCount: number }>("/api/mobile/provider/notifications", { token });
}

export async function markProviderMobileNotifications(token: string, input: { notificationId?: string; all?: boolean }) {
  return apiRequest<{ ok: boolean }>("/api/mobile/provider/notifications/mark-read", {
    method: "POST",
    token,
    body: input,
  });
}

export async function getProviderMobileAvailability(token: string) {
  return apiRequest<{
    schedule: MobileProviderAvailabilityDay[];
    overrides: MobileProviderAvailabilityOverride[];
    settings: { maxJobsPerDay: number | null; leadTimeHours: number | null };
  }>("/api/mobile/provider/availability", { token });
}

export async function getProviderMobilePayouts(token: string) {
  return apiRequest<{
    totals: { onHold: number; eligible: number; released: number };
    payouts: MobileProviderPayout[];
  }>("/api/mobile/provider/payouts", { token });
}

export async function registerProviderPushToken(token: string, body: { expoPushToken: string }) {
  return apiRequest<{ ok: boolean }>("/api/mobile/provider/push/register", {
    method: "POST",
    token,
    body,
  });
}

export async function removeProviderPushToken(token: string, expoPushToken: string) {
  return apiRequest<{ ok: boolean }>(`/api/mobile/provider/push/register?expoPushToken=${encodeURIComponent(expoPushToken)}`, {
    method: "DELETE",
    token,
  });
}

export async function updateProviderMobileProfile(
  token: string,
  body: {
    tradingName: string;
    phone?: string;
    registeredAddress?: string;
    vatNumber?: string;
    profileImageUrl?: string;
    profileImageType?: string;
    headline?: string;
    bio?: string;
    yearsExperience?: string;
  },
) {
  return apiRequest<{ ok: boolean; provider: MobileProviderSummary }>("/api/mobile/provider/me/profile", {
    method: "PATCH",
    token,
    body,
  });
}

export async function updateProviderMobilePassword(
  token: string,
  body: { currentPassword: string; newPassword: string; confirmPassword: string },
) {
  return apiRequest<{ ok: boolean }>("/api/mobile/provider/me/password", {
    method: "POST",
    token,
    body,
  });
}
