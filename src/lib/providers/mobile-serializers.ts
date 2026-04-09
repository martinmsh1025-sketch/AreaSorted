import { formatMoney } from "@/lib/format";

function formatDateLabel(value: Date) {
  return value.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function serializeMobileProviderSummary(input: {
  id: string;
  status: string;
  tradingName?: string | null;
  legalName?: string | null;
  contactEmail: string;
  headline?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  profileImageType?: string | null;
  phone?: string | null;
  registeredAddress?: string | null;
  vatNumber?: string | null;
  yearsExperience?: number | null;
  approvedAt?: Date | null;
  createdAt: Date;
  serviceCategories?: Array<{ categoryKey: string }>;
  coverageAreas?: Array<{ postcodePrefix: string }>;
  pricingRules?: Array<{ active: boolean }>;
}) {
  const activePricingRules = (input.pricingRules || []).filter((rule) => rule.active).length;
  return {
    id: input.id,
    displayName: input.tradingName || input.legalName || "Provider",
    legalName: input.legalName || null,
    tradingName: input.tradingName || null,
    contactEmail: input.contactEmail,
    phone: input.phone || null,
    registeredAddress: input.registeredAddress || null,
    vatNumber: input.vatNumber || null,
    status: input.status,
    headline: input.headline || null,
    bio: input.bio || null,
    profileImageUrl: input.profileImageUrl || null,
    profileImageType: input.profileImageType || null,
    yearsExperience: input.yearsExperience ?? null,
    memberSince: input.createdAt.toISOString(),
    approvedAt: input.approvedAt?.toISOString() || null,
    serviceCategories: (input.serviceCategories || []).map((item) => item.categoryKey),
    coveragePostcodePrefixes: Array.from(new Set((input.coverageAreas || []).map((item) => item.postcodePrefix))).sort(),
    activePricingRules,
  };
}

export function serializeMobileProviderOrder(input: {
  id: string;
  serviceType: string;
  servicePostcode: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  bookingStatus: string;
  totalAmount: number;
  priceSnapshot?: { providerExpectedPayout: number; platformCommissionAmount: number } | null;
  cleanerPayoutAmount?: number | null;
  platformMarginAmount?: number | null;
  customer?: { firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null } | null;
  additionalNotes?: string | null;
}) {
  const payoutValue = input.priceSnapshot?.providerExpectedPayout ?? input.cleanerPayoutAmount ?? input.totalAmount;
  const platformFeeValue = input.priceSnapshot?.platformCommissionAmount ?? input.platformMarginAmount ?? 0;

  return {
    id: input.id,
    serviceType: input.serviceType,
    servicePostcode: input.servicePostcode,
    scheduledDate: input.scheduledDate.toISOString(),
    scheduledDateLabel: formatDateLabel(input.scheduledDate),
    scheduledStartTime: input.scheduledStartTime,
    bookingStatus: input.bookingStatus,
    totalAmount: input.totalAmount,
    totalAmountLabel: formatMoney(input.totalAmount),
    providerExpectedPayout: payoutValue,
    providerExpectedPayoutLabel: formatMoney(payoutValue),
    platformFeeAmount: platformFeeValue,
    platformFeeAmountLabel: formatMoney(platformFeeValue),
    customer: input.customer
      ? {
          name: [input.customer.firstName, input.customer.lastName].filter(Boolean).join(" ") || "Customer",
          email: input.customer.email || null,
          phone: input.customer.phone || null,
        }
      : null,
    additionalNotes: input.additionalNotes || null,
  };
}

export function serializeMobileNotification(input: {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  readAt?: Date | null;
  createdAt: Date;
  bookingId?: string | null;
}) {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link || null,
    read: input.read,
    readAt: input.readAt?.toISOString() || null,
    createdAt: input.createdAt.toISOString(),
    createdAtLabel: input.createdAt.toLocaleString("en-GB"),
    bookingId: input.bookingId || null,
  };
}

export function serializeMobileAvailability(input: {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}) {
  return {
    dayOfWeek: input.dayOfWeek,
    isAvailable: input.isAvailable,
    startTime: input.startTime,
    endTime: input.endTime,
  };
}

export function serializeMobileOverride(input: {
  id: string;
  date: Date;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}) {
  return {
    id: input.id,
    date: input.date.toISOString().split("T")[0],
    isAvailable: input.isAvailable,
    startTime: input.startTime || null,
    endTime: input.endTime || null,
    note: input.note || null,
  };
}

export function serializeMobilePayout(input: {
  id: string;
  bookingId: string;
  status: string;
  amount: number;
  holdUntil?: Date | null;
  availableOn?: Date | null;
  releasedAt?: Date | null;
  paidAt?: Date | null;
  blockedReason?: string | null;
  booking?: {
    quoteRequest?: { reference?: string | null } | null;
    scheduledDate?: Date | null;
    bookingStatus?: string | null;
  } | null;
}) {
  return {
    id: input.id,
    bookingId: input.bookingId,
    bookingReference: input.booking?.quoteRequest?.reference || input.bookingId,
    bookingStatus: input.booking?.bookingStatus || null,
    scheduledDate: input.booking?.scheduledDate?.toISOString() || null,
    status: input.status,
    amount: input.amount,
    amountLabel: formatMoney(input.amount),
    holdUntil: input.holdUntil?.toISOString() || null,
    availableOn: input.availableOn?.toISOString() || null,
    releasedAt: input.releasedAt?.toISOString() || null,
    paidAt: input.paidAt?.toISOString() || null,
    blockedReason: input.blockedReason || null,
  };
}
