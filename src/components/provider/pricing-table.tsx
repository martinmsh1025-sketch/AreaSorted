"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { Check, Loader2, Save, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

/* ─── Types ─── */

type SizeLabel = { value: string; label: string };

type ServiceRow = {
  key: string;
  label: string;
  recommendedHourlyRange: { min: number; max: number };
  hourlyPrice: number | null;
  minimumCharge: number | null;
  sameDayUplift: number | null;
  weekendUplift: number | null;
  active: boolean;
  customQuoteRequired: boolean;
  ruleId: string | null;
  pricingMode: string;
  pricingJson: Record<string, unknown> | null;
  sizeLabels: SizeLabel[];
};

type EditableRow = {
  key: string;
  categoryKey: string;
  pricingMode: string;
  hourlyPrice: string;
  minimumCharge: string;
  sameDayUplift: string;
  weekendUplift: string;
  active: boolean;
  customQuoteRequired: boolean;
  sizePrices: Record<string, string>;
};

type PricingTableProps = {
  categoryKey: string;
  services: ServiceRow[];
  bulkSaveAction: (formData: FormData) => Promise<void>;
  commissionPercent: number;
  bookingFee: number;
  bookingFeeMode: string;
};

/* ─── Helpers ─── */

function toStr(v: number | null, fallback?: number): string {
  if (v != null) return String(v);
  if (fallback != null) return String(fallback);
  return "";
}

function toNum(v: string): number | null {
  const trimmed = v.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/* ─── Component ─── */

export function PricingTable({
  categoryKey,
  services,
  bulkSaveAction,
  commissionPercent,
  bookingFee,
  bookingFeeMode,
}: PricingTableProps) {
  const isCleaning = categoryKey === "CLEANING";
  const isPestControl = categoryKey === "PEST_CONTROL";

  // Build editable state from server data
  const buildEditableRows = useCallback((): EditableRow[] => {
    return services.map((svc) => {
      const midpoint = Math.round(
        (svc.recommendedHourlyRange.min + svc.recommendedHourlyRange.max) / 2
      );
      const sizePrices: Record<string, string> = {};
      if (svc.pricingJson) {
        for (const [k, v] of Object.entries(svc.pricingJson)) {
          sizePrices[k] = v != null ? String(v) : "";
        }
      }
      return {
        key: svc.key,
        categoryKey,
        pricingMode: svc.pricingMode || (isPestControl ? "fixed_per_size" : "hourly"),
        hourlyPrice: toStr(svc.hourlyPrice, midpoint),
        minimumCharge: toStr(svc.minimumCharge),
        sameDayUplift: toStr(svc.sameDayUplift, 15),
        weekendUplift: toStr(svc.weekendUplift, 10),
        active: svc.active,
        customQuoteRequired: svc.customQuoteRequired,
        sizePrices,
      };
    });
  }, [services, categoryKey, isPestControl]);

  const [rows, setRows] = useState<EditableRow[]>(buildEditableRows);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function updateRow(key: string, updates: Partial<EditableRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...updates } : r))
    );
    setDirty(true);
    setSaved(false);
  }

  function updateSizePrice(key: string, size: string, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, sizePrices: { ...r.sizePrices, [size]: value } }
          : r
      )
    );
    setDirty(true);
    setSaved(false);
  }

  function handleBulkSave() {
    const rules = rows.map((r) => ({
      serviceKey: r.key,
      categoryKey: r.categoryKey,
      pricingMode: isPestControl ? "fixed_per_size" : r.pricingMode,
      hourlyPrice: r.pricingMode === "hourly" ? toNum(r.hourlyPrice) : null,
      sameDayUplift: toNum(r.sameDayUplift),
      weekendUplift: toNum(r.weekendUplift),
      minimumCharge: toNum(r.minimumCharge),
      customQuoteRequired: r.customQuoteRequired,
      active: r.active,
      pricingJson:
        (isPestControl || r.pricingMode === "fixed_per_size")
          ? Object.fromEntries(
              Object.entries(r.sizePrices).map(([k, v]) => [k, toNum(v) ?? 0])
            )
          : null,
    }));

    const fd = new FormData();
    fd.set("rules", JSON.stringify(rules));

    startTransition(async () => {
      await bulkSaveAction(fd);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    });
  }

  // For each row, compute what the provider receives
  function getProviderPayout(row: EditableRow, svc: ServiceRow): string {
    let base = 0;
    if (row.pricingMode === "hourly") {
      const rate = toNum(row.hourlyPrice) ?? 0;
      // Show per-hour payout
      const commission = rate * (commissionPercent / 100);
      return formatMoney(rate - commission) + "/hr";
    } else {
      // fixed_per_size — show standard size payout
      base = toNum(row.sizePrices["standard"] ?? "") ?? 0;
      if (base === 0) base = toNum(row.sizePrices["small"] ?? "") ?? 0;
    }
    const commission = base * (commissionPercent / 100);
    return formatMoney(base - commission);
  }

  return (
    <div className="space-y-4">
      {/* Sticky save bar */}
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Your Service Prices</h2>
          {dirty && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5" />
              Unsaved changes
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check className="size-3.5" />
              All changes saved
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          onClick={handleBulkSave}
          disabled={isPending || !dirty}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {isPending ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs w-[200px]">
                Service
              </th>
              {!isPestControl && (
                <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center w-[130px]">
                  {isCleaning ? "Mode" : ""}
                </th>
              )}
              {/* Hourly rate or size prices column */}
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center">
                {isPestControl ? "Size Prices" : "Rate / Prices"}
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center w-[80px]">
                Same-day
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center w-[80px]">
                Weekend
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center w-[80px]">
                Min.
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center w-[100px]">
                You Earn
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center w-[60px]">
                Active
              </th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-xs text-center w-[70px]">
                Custom
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, idx) => {
              const svc = services[idx];
              const showHourly = !isPestControl && row.pricingMode === "hourly";
              const showSizePrices = isPestControl || row.pricingMode === "fixed_per_size";

              return (
                <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                  {/* Service name + market rate */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <span className="font-medium text-sm">{svc.label}</span>
                      {!isPestControl && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                          <TrendingUp className="size-3" />
                          £{svc.recommendedHourlyRange.min}–£{svc.recommendedHourlyRange.max}/hr
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Mode toggle (Cleaning only) */}
                  {!isPestControl && (
                    <td className="px-3 py-3 text-center">
                      {isCleaning && (
                        <div className="inline-flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(row.key, { pricingMode: "hourly" })
                            }
                            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                              row.pricingMode === "hourly"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Hourly
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(row.key, { pricingMode: "fixed_per_size" })
                            }
                            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                              row.pricingMode === "fixed_per_size"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Fixed
                          </button>
                        </div>
                      )}
                    </td>
                  )}

                  {/* Rate / Prices */}
                  <td className="px-3 py-3">
                    {showHourly && (
                      <div className="flex items-center justify-center">
                        <PriceInput
                          value={row.hourlyPrice}
                          onChange={(v) => updateRow(row.key, { hourlyPrice: v })}
                          suffix="/hr"
                          min={svc.recommendedHourlyRange.min}
                          max={svc.recommendedHourlyRange.max}
                        />
                      </div>
                    )}
                    {showSizePrices && (
                      <div className="flex items-center justify-center gap-2">
                        {(svc.sizeLabels.length > 0
                          ? svc.sizeLabels
                          : [
                              { value: "small", label: "Small" },
                              { value: "standard", label: "Standard" },
                              { value: "large", label: "Large" },
                            ]
                        ).map((sz) => (
                          <div key={sz.value} className="space-y-0.5">
                            <label className="block text-[9px] text-muted-foreground text-center truncate max-w-[70px]">
                              {sz.label}
                            </label>
                            <PriceInput
                              value={row.sizePrices[sz.value] ?? ""}
                              onChange={(v) =>
                                updateSizePrice(row.key, sz.value, v)
                              }
                              compact
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Same-day uplift */}
                  <td className="px-3 py-3 text-center">
                    <PriceInput
                      value={row.sameDayUplift}
                      onChange={(v) => updateRow(row.key, { sameDayUplift: v })}
                      compact
                    />
                  </td>

                  {/* Weekend uplift */}
                  <td className="px-3 py-3 text-center">
                    <PriceInput
                      value={row.weekendUplift}
                      onChange={(v) => updateRow(row.key, { weekendUplift: v })}
                      compact
                    />
                  </td>

                  {/* Min charge */}
                  <td className="px-3 py-3 text-center">
                    <PriceInput
                      value={row.minimumCharge}
                      onChange={(v) => updateRow(row.key, { minimumCharge: v })}
                      compact
                      placeholder="—"
                    />
                  </td>

                  {/* You earn */}
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                      {getProviderPayout(row, svc)}
                    </span>
                    <div className="text-[9px] text-muted-foreground">
                      after {commissionPercent}%
                    </div>
                  </td>

                  {/* Active toggle */}
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) =>
                        updateRow(row.key, { active: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 size-4"
                    />
                  </td>

                  {/* Custom quote */}
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.customQuoteRequired}
                      onChange={(e) =>
                        updateRow(row.key, {
                          customQuoteRequired: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 size-4"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info footer */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground space-y-1">
        <p>
          <strong>Commission:</strong> The platform charges {commissionPercent}%
          commission on your rate.{" "}
          <strong>Booking fee:</strong>{" "}
          {bookingFeeMode === "percent"
            ? `${bookingFee}% is added to the customer's total.`
            : `£${bookingFee.toFixed(2)} is added to the customer's total.`}
        </p>
        <p>
          <strong>Custom quote:</strong> When enabled, customers will request a
          quote instead of booking at a fixed price. Use this for complex or
          variable jobs.
        </p>
      </div>
    </div>
  );
}

/* ─── Price Input ─── */

function PriceInput({
  value,
  onChange,
  suffix,
  compact,
  placeholder = "0",
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  compact?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  const numVal = Number(value);
  const isBelow = min != null && value !== "" && numVal > 0 && numVal < min;
  const isAbove = max != null && value !== "" && numVal > max;

  return (
    <div className={`relative inline-flex items-center ${compact ? "w-[70px]" : "w-[90px]"}`}>
      <span className="absolute left-2 text-xs text-muted-foreground">£</span>
      <input
        type="number"
        step="1"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border bg-background pl-5 pr-1.5 py-1.5 text-xs tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isBelow
            ? "border-amber-400 dark:border-amber-600"
            : isAbove
              ? "border-red-400 dark:border-red-600"
              : ""
        }`}
      />
      {suffix && (
        <span className="absolute right-1.5 text-[10px] text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
