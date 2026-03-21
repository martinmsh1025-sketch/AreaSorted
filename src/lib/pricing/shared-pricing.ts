/**
 * Shared pricing calculation logic — client-safe (no Prisma, no server imports).
 *
 * This is the SINGLE SOURCE OF TRUTH for pricing math used by:
 *   - prisma-pricing.ts (server-side price preview / quote engine)
 *   - PricingCalculator component (provider portal client-side preview)
 *
 * DO NOT duplicate any of these formulas elsewhere.
 */

import { cleaningConditionOptions } from "@/lib/service-catalog";
import type { CleaningConditionValue, PropertyTypeValue } from "@/lib/service-catalog";

/* ────────────────────────────────────────────────── */
/*  Rounding                                          */
/* ────────────────────────────────────────────────── */

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ────────────────────────────────────────────────── */
/*  Hours estimation                                  */
/* ────────────────────────────────────────────────── */

/**
 * Estimate hours for a cleaning job based on room counts, property type,
 * and cleaning condition.
 *
 * This mirrors the logic used by the customer-facing quote engine.
 * Any change here MUST be reflected in both the server preview and
 * the provider calculator.
 */
export function estimateCleaningHours(
  bedrooms: number,
  bathrooms: number,
  kitchens: number,
  propertyType?: string,
  cleaningCondition?: CleaningConditionValue | string,
): number {
  const baseHours = 0.8;
  const bedroomHours = Math.max(bedrooms, 0) * 0.95;
  const bathroomHours = Math.max(bathrooms, 0) * 0.55;
  const kitchenHours = Math.max(kitchens, 1) * 0.45;
  let total = baseHours + bedroomHours + bathroomHours + kitchenHours;

  // Property type multiplier
  switch (propertyType) {
    case "terraced":
      total *= 1.05;
      break;
    case "semi-detached":
      total *= 1.1;
      break;
    case "detached":
      total *= 1.2;
      break;
    case "commercial":
      total *= 1.3;
      break;
    // flat / default: no multiplier
  }

  // Cleaning condition multiplier — sourced from the canonical options list
  const conditionOption = cleaningConditionOptions.find(
    (o) => o.value === cleaningCondition,
  );
  const conditionMultiplier = conditionOption?.multiplier ?? 1;
  total *= conditionMultiplier;

  return Math.round(total * 10) / 10; // round to 1 decimal
}

/* ────────────────────────────────────────────────── */
/*  Price breakdown calculation                       */
/* ────────────────────────────────────────────────── */

export type PriceBreakdownInput = {
  categoryKey: string;
  pricingMode: "hourly" | "fixed_per_size" | string;
  hourlyPrice: number;
  /** For cleaning+hourly: room counts for hours estimation */
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  propertyType?: PropertyTypeValue | string;
  cleaningCondition?: CleaningConditionValue | string;
  /** For fixed_per_size / pest control: price per size from pricingJson */
  sizePrices?: Record<string, number> | null;
  /** Selected size key (e.g. "small", "standard", "large") */
  selectedSize?: string;
  /** Duration from catalog for the selected size (non-cleaning hourly fallback) */
  durationHours?: number;
  /** Surcharges */
  sameDayUplift?: number;
  weekendUplift?: number;
  sameDay?: boolean;
  weekend?: boolean;
  /** Platform fees */
  commissionPercent: number;
  bookingFee: number;
  bookingFeeMode?: "fixed" | "percent" | string;
  /** Add-ons total (from catalog) */
  addOnsTotal?: number;
};

export type PriceBreakdownResult = {
  /** Provider's base price before extras */
  providerBasePrice: number;
  /** Label describing how the base price was calculated */
  priceLabel: string;
  /** Estimated hours (only for hourly cleaning) */
  estimatedHours: number | null;
  /** Same-day extra amount applied */
  sameDayExtra: number;
  /** Weekend extra amount applied */
  weekendExtra: number;
  /** Provider subtotal (base + extras + sameDay + weekend) — this is what provider receives */
  providerSubtotal: number;
  /** Platform commission amount (charged to customer ON TOP, NOT deducted from provider) */
  commissionAmount: number;
  /** What the provider receives = providerSubtotal (commission is NOT deducted) */
  providerPayout: number;
  /** Booking fee added for customer */
  actualBookingFee: number;
  /** Add-ons total */
  addOnsTotal: number;
  /** Total the customer pays = providerSubtotal + bookingFee + commission */
  customerTotal: number;
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate a full price breakdown matching the customer-facing pricing engine.
 *
 * This is the EXACT same math used in `previewProviderPricing()` in
 * prisma-pricing.ts — just expressed as a pure function with no DB access.
 */
export function calculatePriceBreakdown(input: PriceBreakdownInput): PriceBreakdownResult {
  const {
    categoryKey,
    pricingMode,
    hourlyPrice,
    bedrooms,
    bathrooms,
    kitchens,
    propertyType,
    cleaningCondition,
    sizePrices,
    selectedSize = "standard",
    durationHours,
    sameDayUplift = 0,
    weekendUplift = 0,
    sameDay = false,
    weekend = false,
    commissionPercent,
    bookingFee,
    bookingFeeMode = "fixed",
    addOnsTotal = 0,
  } = input;

  let providerBasePrice = 0;
  let priceLabel = "";
  let estimatedHours: number | null = null;

  const isCleaning = categoryKey === "CLEANING";
  const isPestControl = categoryKey === "PEST_CONTROL";
  const isFixedPerSize = pricingMode === "fixed_per_size";

  if (isCleaning && isFixedPerSize) {
    // Cleaning with fixed-per-size: lookup from sizePrices
    const sizePrice = sizePrices ? Number(sizePrices[selectedSize] ?? 0) : 0;
    providerBasePrice = sizePrice;
    priceLabel = `Fixed price (${selectedSize})`;
  } else if (isCleaning && pricingMode === "hourly") {
    // Cleaning hourly: estimate hours from room details
    const hours = estimateCleaningHours(
      bedrooms ?? 1,
      bathrooms ?? 1,
      kitchens ?? 1,
      propertyType,
      cleaningCondition,
    );
    estimatedHours = hours;
    providerBasePrice = hourlyPrice * hours;
    priceLabel = `${formatMoney(hourlyPrice)}/hr × ${hours}h`;
  } else if (isPestControl) {
    // Pest control: fixed price per size from pricingJson, fallback to hourly
    const sizePrice = sizePrices ? Number(sizePrices[selectedSize] ?? 0) : 0;
    if (sizePrice > 0) {
      providerBasePrice = sizePrice;
      priceLabel = `Fixed price (${selectedSize})`;
    } else {
      const hours = durationHours ?? 2;
      providerBasePrice = hourlyPrice * hours;
      priceLabel = `${formatMoney(hourlyPrice)}/hr × ${hours}h`;
    }
  } else {
    // All other categories: fixed_per_size or hourly fallback
    if (isFixedPerSize && sizePrices) {
      const sizePrice = Number(sizePrices[selectedSize] ?? 0);
      if (sizePrice > 0) {
        providerBasePrice = sizePrice;
        priceLabel = `Fixed price (${selectedSize})`;
      } else {
        const hours = durationHours ?? 1;
        providerBasePrice = hourlyPrice * hours;
        priceLabel = `${formatMoney(hourlyPrice)}/hr × ${hours}h`;
      }
    } else {
      const hours = durationHours ?? 1;
      providerBasePrice = hourlyPrice * hours;
      priceLabel = `${formatMoney(hourlyPrice)}/hr × ${hours}h`;
    }
  }

  // Add add-ons to base price (matches server engine: addOns go into providerBasePrice)
  providerBasePrice += addOnsTotal;

  // Extras
  const sameDayExtra = sameDay ? sameDayUplift : 0;
  const weekendExtra = weekend ? weekendUplift : 0;
  const providerSubtotal = providerBasePrice + sameDayExtra + weekendExtra;

  // Commission: % of provider subtotal — charged to customer ON TOP
  // This matches the server engine: commission is an additional customer charge,
  // NOT deducted from the provider's payout
  const commissionAmount = roundMoney(providerSubtotal * (commissionPercent / 100));

  // Provider payout = full subtotal (commission is NOT deducted from provider)
  const providerPayout = roundMoney(providerSubtotal);

  // Booking fee: fixed or % of provider subtotal
  const actualBookingFee =
    bookingFeeMode === "percent"
      ? roundMoney(providerSubtotal * (bookingFee / 100))
      : bookingFee;

  // Customer total = provider subtotal + booking fee + commission
  // Matches server engine: totalCustomerPay = providerBasePrice + bookingFee + commissionAmount
  const customerTotal = roundMoney(providerSubtotal + actualBookingFee + commissionAmount);

  return {
    providerBasePrice: roundMoney(providerBasePrice),
    priceLabel,
    estimatedHours,
    sameDayExtra,
    weekendExtra,
    providerSubtotal: roundMoney(providerSubtotal),
    commissionAmount,
    providerPayout,
    actualBookingFee,
    addOnsTotal: roundMoney(addOnsTotal),
    customerTotal,
  };
}
