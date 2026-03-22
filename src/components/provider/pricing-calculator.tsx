"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import {
  estimateCleaningHours,
  calculatePriceBreakdown,
} from "@/lib/pricing/shared-pricing";
import { cleaningConditionOptions } from "@/lib/service-catalog";
import { formatMoney } from "@/lib/format";

/* ─── Types ─── */

type SizeOption = {
  value: string;
  label: string;
  durationHours: number;
};

type AddOn = {
  value: string;
  label: string;
  amount: number;
};

type ServiceInfo = {
  key: string;
  label: string;
  sizeOptions: SizeOption[];
  addOns: AddOn[];
  recommendedHourlyRange: { min: number; max: number };
};

type PricingRule = {
  serviceKey: string;
  hourlyPrice: number | null;
  sameDayUplift: number | null;
  weekendUplift: number | null;
  active: boolean;
  pricingMode: string;
  pricingJson: Record<string, unknown> | null;
};

type PricingCalculatorProps = {
  categoryKey: string;
  services: ServiceInfo[];
  pricingRules: PricingRule[];
  bookingFee: number;
  bookingFeeMode?: string;
  commissionPercent: number;
};

/* ─── Component ─── */

export function PricingCalculator({
  categoryKey,
  services,
  pricingRules,
  bookingFee,
  bookingFeeMode = "fixed",
  commissionPercent,
}: PricingCalculatorProps) {
  const [selectedService, setSelectedService] = useState(
    services[0]?.key ?? ""
  );
  const [selectedSize, setSelectedSize] = useState("standard");
  const [sameDay, setSameDay] = useState(false);
  const [weekend, setWeekend] = useState(false);

  // Cleaning-specific
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [propertyType, setPropertyType] = useState("flat");
  const [cleaningCondition, setCleaningCondition] = useState("standard");

  const service = useMemo(
    () => services.find((s) => s.key === selectedService),
    [services, selectedService]
  );

  const rule = useMemo(
    () => pricingRules.find((r) => r.serviceKey === selectedService),
    [pricingRules, selectedService]
  );

  const sizeOption = useMemo(
    () => service?.sizeOptions.find((s) => s.value === selectedSize),
    [service, selectedSize]
  );

  const isCleaning = categoryKey === "CLEANING";
  const isPestControl = categoryKey === "PEST_CONTROL";
  const pricingMode = rule?.pricingMode || "hourly";

  // Build sizePrices from pricingJson
  const sizePrices = useMemo(() => {
    const json = rule?.pricingJson;
    if (!json || typeof json !== "object") return null;
    const prices: Record<string, number> = {};
    for (const [k, v] of Object.entries(json)) {
      prices[k] = Number(v) || 0;
    }
    return prices;
  }, [rule]);

  // Use the shared pricing engine for the breakdown
  const breakdown = useMemo(() => {
    if (!rule || !rule.active) return null;

    return calculatePriceBreakdown({
      categoryKey,
      pricingMode,
      hourlyPrice: rule.hourlyPrice ?? 0,
      bedrooms,
      bathrooms,
      kitchens,
      propertyType,
      cleaningCondition,
      sizePrices,
      selectedSize,
      durationHours: sizeOption?.durationHours,
      sameDayUplift: rule.sameDayUplift ?? 0,
      weekendUplift: rule.weekendUplift ?? 0,
      sameDay,
      weekend,
      commissionPercent,
      bookingFee,
      bookingFeeMode,
    });
  }, [
    rule,
    categoryKey,
    pricingMode,
    bedrooms,
    bathrooms,
    kitchens,
    propertyType,
    cleaningCondition,
    sizePrices,
    selectedSize,
    sizeOption,
    sameDay,
    weekend,
    commissionPercent,
    bookingFee,
    bookingFeeMode,
  ]);

  const hasRule = !!rule && rule.active;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-blue-50/60 dark:bg-blue-950/20">
        <Calculator className="size-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
          Price Calculator
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Service selector */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Service
          </label>
          <select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setSelectedSize("standard");
            }}
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {services.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cleaning: property details */}
        {isCleaning && pricingMode === "hourly" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Simulate property
            </label>
            <div className="grid grid-cols-3 gap-2">
              <SelectField
                label="Beds"
                value={bedrooms}
                onChange={setBedrooms}
                options={[0, 1, 2, 3, 4, 5, 6].map((n) => ({
                  value: n,
                  label: n === 0 ? "Studio" : String(n),
                }))}
              />
              <SelectField
                label="Baths"
                value={bathrooms}
                onChange={setBathrooms}
                options={[1, 2, 3, 4, 5].map((n) => ({
                  value: n,
                  label: String(n),
                }))}
              />
              <SelectField
                label="Kitchens"
                value={kitchens}
                onChange={setKitchens}
                options={[1, 2, 3].map((n) => ({
                  value: n,
                  label: String(n),
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">
                  Property
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="flat">Flat</option>
                  <option value="terraced">Terraced</option>
                  <option value="semi-detached">Semi-detached</option>
                  <option value="detached">Detached</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">
                  Condition
                </label>
                <select
                  value={cleaningCondition}
                  onChange={(e) => setCleaningCondition(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cleaningConditionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.multiplier}x)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Est. hours:{" "}
              <span className="font-medium text-foreground/70">
                {estimateCleaningHours(
                  bedrooms,
                  bathrooms,
                  kitchens,
                  propertyType,
                  cleaningCondition
                )}
                h
              </span>
            </p>
          </div>
        )}

        {/* Size selector (non-cleaning / pest control) */}
        {service &&
          service.sizeOptions.length > 0 &&
          !(isCleaning && pricingMode === "hourly") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {isPestControl ? "Job size" : "Property size"}
              </label>
              <div className="grid grid-cols-3 gap-1">
                {service.sizeOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedSize(s.value)}
                    className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      selectedSize === s.value
                        ? "bg-blue-600 text-white"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={sameDay}
              onChange={(e) => setSameDay(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Same-day
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={weekend}
              onChange={(e) => setWeekend(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Weekend
          </label>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Price breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Price Breakdown
          </h3>

          {!hasRule || !breakdown ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center">
              Set prices for this service to see the breakdown.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <BreakdownRow
                  label={breakdown.priceLabel}
                  value={formatMoney(breakdown.providerBasePrice)}
                />
                {breakdown.sameDayExtra > 0 && (
                  <BreakdownRow
                    label="Same-day extra"
                    value={`+${formatMoney(breakdown.sameDayExtra)}`}
                  />
                )}
                {breakdown.weekendExtra > 0 && (
                  <BreakdownRow
                    label="Weekend extra"
                    value={`+${formatMoney(breakdown.weekendExtra)}`}
                  />
                )}
              </div>

              {/* Provider payout — highlighted */}
              <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2">
                <BreakdownRow
                  label="You receive"
                  value={formatMoney(breakdown.providerPayout)}
                  variant="success"
                  bold
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <BreakdownRow
                  label={
                    bookingFeeMode === "percent"
                      ? `Booking fee (${bookingFee}%)`
                      : "Booking fee"
                  }
                  value={`+${formatMoney(breakdown.actualBookingFee)}`}
                  muted
                />
                <BreakdownRow
                  label={`Commission (${commissionPercent}%)`}
                  value={`+${formatMoney(breakdown.commissionAmount)}`}
                  muted
                />
              </div>

              <div className="border-t pt-2">
                <BreakdownRow
                  label="Customer pays"
                  value={formatMoney(breakdown.customerTotal)}
                  bold
                />
              </div>
            </div>
          )}

          {/* Add-ons */}
          {service && service.addOns.length > 0 && (
            <div className="border-t pt-2 space-y-1.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Optional add-ons (platform-set)
              </span>
              {service.addOns.map((addon) => (
                <BreakdownRow
                  key={addon.value}
                  label={addon.label}
                  value={`+${formatMoney(addon.amount)}`}
                  muted
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  variant,
  bold,
  muted,
}: {
  label: string;
  value: string;
  variant?: "destructive" | "success";
  bold?: boolean;
  muted?: boolean;
}) {
  const valueColor =
    variant === "destructive"
      ? "text-red-600 dark:text-red-400"
      : variant === "success"
        ? "text-green-600 dark:text-green-400"
        : muted
          ? "text-muted-foreground"
          : "text-foreground";

  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={`text-xs ${muted ? "text-muted-foreground" : "text-foreground/80"}`}
      >
        {label}
      </span>
      <span
        className={`text-xs tabular-nums ${bold ? "font-bold" : "font-medium"} ${valueColor}`}
      >
        {value}
      </span>
    </div>
  );
}
