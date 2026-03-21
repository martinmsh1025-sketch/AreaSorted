"use client";

import { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

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

/* ─── Helpers ─── */

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

function estimateCleaningHours(
  bedrooms: number,
  bathrooms: number,
  kitchens: number,
  propertyType: string,
  cleaningCondition: string
): number {
  const baseHours = 0.8;
  const bedroomHours = Math.max(bedrooms, 0) * 0.95;
  const bathroomHours = Math.max(bathrooms, 0) * 0.55;
  const kitchenHours = Math.max(kitchens, 1) * 0.45;
  let total = baseHours + bedroomHours + bathroomHours + kitchenHours;

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
  }

  switch (cleaningCondition) {
    case "light":
      total *= 0.95;
      break;
    case "heavy":
      total *= 1.18;
      break;
    case "very-heavy":
      total *= 1.38;
      break;
  }

  return Math.round(total * 10) / 10;
}

/* ─── Component ─── */

export function PricingCalculator({
  categoryKey,
  services,
  pricingRules,
  bookingFee,
  bookingFeeMode = "fixed",
  commissionPercent,
}: PricingCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
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
  const isFixedPerSize = pricingMode === "fixed_per_size";

  // Calculate prices
  let providerBasePrice = 0;
  let priceLabel = "";

  if (isCleaning && isFixedPerSize) {
    const json = rule?.pricingJson;
    const sizePrice = json ? Number(json[selectedSize] ?? 0) : 0;
    providerBasePrice = sizePrice;
    priceLabel = `Fixed price (${selectedSize})`;
  } else if (isCleaning && pricingMode === "hourly") {
    const hourlyRate = rule?.hourlyPrice ?? 0;
    const estimatedHours = estimateCleaningHours(
      bedrooms,
      bathrooms,
      kitchens,
      propertyType,
      cleaningCondition
    );
    providerBasePrice = hourlyRate * estimatedHours;
    priceLabel = `${formatMoney(hourlyRate)}/hr × ${estimatedHours}h`;
  } else if (isPestControl) {
    const json = rule?.pricingJson;
    const sizePrice = json ? Number(json[selectedSize] ?? 0) : 0;
    providerBasePrice =
      sizePrice > 0
        ? sizePrice
        : (rule?.hourlyPrice ?? 0) * (sizeOption?.durationHours ?? 2);
    priceLabel =
      sizePrice > 0
        ? `Fixed price (${selectedSize})`
        : `${formatMoney(rule?.hourlyPrice ?? 0)}/hr × ${sizeOption?.durationHours ?? 2}h`;
  } else {
    const hourlyRate = rule?.hourlyPrice ?? 0;
    const estimatedHours = sizeOption?.durationHours ?? 0;
    providerBasePrice = hourlyRate * estimatedHours;
    priceLabel = `${formatMoney(hourlyRate)}/hr × ${estimatedHours}h`;
  }

  const sameDayExtra = sameDay ? (rule?.sameDayUplift ?? 0) : 0;
  const weekendExtra = weekend ? (rule?.weekendUplift ?? 0) : 0;
  const providerSubtotal = providerBasePrice + sameDayExtra + weekendExtra;
  const commissionAmount =
    Math.round(providerSubtotal * (commissionPercent / 100) * 100) / 100;
  const providerPayout =
    Math.round((providerSubtotal - commissionAmount) * 100) / 100;
  const actualBookingFee =
    bookingFeeMode === "percent"
      ? Math.round(providerSubtotal * (bookingFee / 100) * 100) / 100
      : bookingFee;
  const customerTotal =
    Math.round((providerSubtotal + actualBookingFee) * 100) / 100;

  const hasRule = !!rule && rule.active;

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Price Calculator
          </span>
          <span className="text-xs text-muted-foreground">
            — Preview what customers will pay and what you earn
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="px-4 py-4 bg-blue-50/30 dark:bg-blue-950/10 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: Inputs */}
            <div className="space-y-3">
              {/* Service */}
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Simulate property
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <SelectField
                      label="Bedrooms"
                      value={bedrooms}
                      onChange={setBedrooms}
                      options={[0, 1, 2, 3, 4, 5, 6].map((n) => ({
                        value: n,
                        label: n === 0 ? "Studio" : String(n),
                      }))}
                    />
                    <SelectField
                      label="Bathrooms"
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
                        <option value="light">Light (0.95×)</option>
                        <option value="standard">Standard (1.0×)</option>
                        <option value="heavy">Heavy (1.18×)</option>
                        <option value="very-heavy">Very Heavy (1.38×)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Estimated hours:{" "}
                    {estimateCleaningHours(
                      bedrooms,
                      bathrooms,
                      kitchens,
                      propertyType,
                      cleaningCondition
                    )}
                    h
                  </p>
                </div>
              )}

              {/* Size selector (non-cleaning hourly) */}
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
                              : "bg-white text-muted-foreground hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
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
            </div>

            {/* Right: Breakdown */}
            <div className="rounded-lg border bg-white dark:bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Price Breakdown
              </h3>

              {!hasRule ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  Set prices for this service to see the breakdown.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <BreakdownRow label={priceLabel} value={formatMoney(providerBasePrice)} />
                    {sameDayExtra > 0 && (
                      <BreakdownRow
                        label="Same-day extra"
                        value={`+${formatMoney(sameDayExtra)}`}
                      />
                    )}
                    {weekendExtra > 0 && (
                      <BreakdownRow
                        label="Weekend extra"
                        value={`+${formatMoney(weekendExtra)}`}
                      />
                    )}
                  </div>

                  <div className="border-t pt-2 space-y-1.5">
                    <BreakdownRow
                      label={`Commission (${commissionPercent}%)`}
                      value={`−${formatMoney(commissionAmount)}`}
                      variant="destructive"
                    />
                    <BreakdownRow
                      label="You receive"
                      value={formatMoney(providerPayout)}
                      variant="success"
                      bold
                    />
                  </div>

                  <div className="border-t pt-2 space-y-1.5">
                    <BreakdownRow
                      label={
                        bookingFeeMode === "percent"
                          ? `Booking fee (${bookingFee}%)`
                          : "Booking fee"
                      }
                      value={`+${formatMoney(actualBookingFee)}`}
                      muted
                    />
                    <BreakdownRow
                      label="Customer pays"
                      value={formatMoney(customerTotal)}
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
      )}
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
