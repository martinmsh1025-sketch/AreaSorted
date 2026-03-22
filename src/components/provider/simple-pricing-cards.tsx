"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Loader2,
  Pencil,
  X,
  Star,
  CircleCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/app/provider/pricing/actions";
import { formatMoney } from "@/lib/format";

/* ─── Types ─── */

type SizeLabel = { value: string; label: string };

export type SimplePricingService = {
  key: string;
  label: string;
  categoryKey: string;
  pricingMode: string; // "hourly" | "fixed_per_size"
  recommendedHourlyPrice: number | null; // midpoint of range
  recommendedHourlyRange: { min: number; max: number };
  recommendedSizePrices: Record<string, number> | null; // for fixed_per_size
  currentHourlyPrice: number | null;
  currentSizePrices: Record<string, number> | null;
  sizeLabels: SizeLabel[];
  isActive: boolean;
  hasExistingRule: boolean;
};

type PricingCardsProps = {
  services: SimplePricingService[];
  commissionPercent: number;
  bookingFee: number;
  bookingFeeMode: string;
  acceptAllAction: (formData: FormData) => Promise<ActionResult>;
  saveSingleAction: (formData: FormData) => Promise<ActionResult>;
  allAccepted: boolean;
};

/* ─── Helpers ─── */

/**
 * Provider receives their FULL price — commission is charged to the customer
 * ON TOP, NOT deducted from the provider's payout.
 */
function getProviderEarnings(price: number): number {
  return price;
}

/* ─── Component ─── */

export function SimplePricingCards({
  services,
  commissionPercent,
  bookingFee,
  bookingFeeMode,
  acceptAllAction,
  saveSingleAction,
  allAccepted,
}: PricingCardsProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editSizePrices, setEditSizePrices] = useState<Record<string, string>>(
    {}
  );
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleAcceptAll() {
    const rules = services.map((svc) => ({
      serviceKey: svc.key,
      categoryKey: svc.categoryKey,
      pricingMode: svc.pricingMode,
      hourlyPrice: svc.recommendedHourlyPrice,
      pricingJson: svc.recommendedSizePrices,
    }));

    const fd = new FormData();
    fd.set("rules", JSON.stringify(rules));

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await acceptAllAction(fd);
        if (result.success) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
        } else {
          setErrorMessage(result.error);
        }
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    });
  }

  function startEditing(svc: SimplePricingService) {
    setEditingKey(svc.key);
    if (svc.pricingMode === "hourly") {
      setEditValue(
        String(svc.currentHourlyPrice ?? svc.recommendedHourlyPrice ?? "")
      );
    } else {
      const prices: Record<string, string> = {};
      const current = svc.currentSizePrices ?? svc.recommendedSizePrices ?? {};
      for (const [k, v] of Object.entries(current)) {
        prices[k] = String(v);
      }
      setEditSizePrices(prices);
    }
  }

  function cancelEditing() {
    setEditingKey(null);
    setEditValue("");
    setEditSizePrices({});
  }

  function handleSaveSingle(svc: SimplePricingService) {
    const rule = {
      serviceKey: svc.key,
      categoryKey: svc.categoryKey,
      pricingMode: svc.pricingMode,
      hourlyPrice:
        svc.pricingMode === "hourly" ? Number(editValue) || null : null,
      pricingJson:
        svc.pricingMode === "fixed_per_size"
          ? Object.fromEntries(
              Object.entries(editSizePrices).map(([k, v]) => [
                k,
                Number(v) || 0,
              ])
            )
          : null,
      active: true,
    };

    const fd = new FormData();
    fd.set("rule", JSON.stringify(rule));

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await saveSingleAction(fd);
        if (result.success) {
          setEditingKey(null);
          setEditValue("");
          setEditSizePrices({});
          setSavedKeys((prev) => new Set(prev).add(svc.key));
          setTimeout(() => {
            setSavedKeys((prev) => {
              const next = new Set(prev);
              next.delete(svc.key);
              return next;
            });
          }, 3000);
        } else {
          setErrorMessage(result.error);
        }
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    });
  }

  function toggleActive(svc: SimplePricingService, active: boolean) {
    const rule = {
      serviceKey: svc.key,
      categoryKey: svc.categoryKey,
      pricingMode: svc.pricingMode,
      hourlyPrice: svc.currentHourlyPrice ?? svc.recommendedHourlyPrice,
      pricingJson: svc.currentSizePrices ?? svc.recommendedSizePrices,
      active,
    };

    const fd = new FormData();
    fd.set("rule", JSON.stringify(rule));

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await saveSingleAction(fd);
        if (!result.success) {
          setErrorMessage(result.error);
        }
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    });
  }

  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <div className="space-y-4">
      {/* ── Accept All banner ── */}
      {!allAccepted && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-950/30 p-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                Recommended Prices Ready
              </h2>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Accept competitive London market rates with one click.
            </p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 px-4 text-xs font-semibold"
              onClick={handleAcceptAll}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
              {isPending ? "Saving..." : "Accept All"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Success message ── */}
      {showSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-3 py-2 flex items-center gap-2">
          <CircleCheck className="size-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-green-700 dark:text-green-300">
            All prices saved!
          </span>
        </div>
      )}

      {/* ── Error message ── */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-3 py-2 flex items-center gap-2">
          <AlertCircle className="size-3.5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-xs font-medium text-red-700 dark:text-red-300 flex-1 min-w-0">
            {errorMessage}
          </span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 shrink-0"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* ── Status summary ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-foreground">
          Services ({activeCount}/{services.length})
        </h2>
      </div>

      {/* ── Service cards — 2-col grid ── */}
      <div className="grid grid-cols-2 gap-2">
        {services.map((svc) => {
          const isEditing = editingKey === svc.key;
          const justSaved = savedKeys.has(svc.key);
          const isHourly = svc.pricingMode === "hourly";
          const displayPrice = svc.currentHourlyPrice ?? svc.recommendedHourlyPrice;

          return (
            <div
              key={svc.key}
              className={`rounded-lg border transition-all ${
                svc.isActive
                  ? "bg-card border-border"
                  : "bg-muted/30 border-border/50 opacity-60"
              } ${justSaved ? "ring-2 ring-green-400/50" : ""}`}
            >
              <div className="px-3 py-2.5 space-y-2">
                {/* Top row: name + toggle */}
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-xs leading-tight line-clamp-2">
                        {svc.label}
                      </span>
                      {svc.isActive && svc.hasExistingRule && !isEditing && (
                        <CircleCheck className="size-3 text-green-500 shrink-0" />
                      )}
                    </div>
                    {justSaved && (
                      <span className="text-[9px] font-medium text-green-600 dark:text-green-400">
                        Saved!
                      </span>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={svc.isActive}
                      onChange={(e) => toggleActive(svc, e.target.checked)}
                      className="sr-only peer"
                      disabled={isPending}
                    />
                    <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Price row */}
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div className="space-y-1.5">
                    {isHourly ? (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          £
                        </span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full rounded-md border bg-background pl-5 pr-8 py-1.5 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                          /hr
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1">
                        {svc.sizeLabels.map((sz) => (
                          <div key={sz.value}>
                            <label className="block text-[8px] text-muted-foreground mb-0.5 truncate">
                              {sz.label}
                            </label>
                            <div className="relative">
                              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
                                £
                              </span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={editSizePrices[sz.value] ?? ""}
                                onChange={(e) =>
                                  setEditSizePrices((prev) => ({
                                    ...prev,
                                    [sz.value]: e.target.value,
                                  }))
                                }
                                className="w-full rounded border bg-background pl-3.5 pr-1 py-1 text-[10px] tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveSingle(svc)}
                        disabled={isPending}
                        className="flex-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white py-1 text-[10px] font-medium transition-colors disabled:opacity-50"
                      >
                        {isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-md bg-muted hover:bg-muted/80 text-muted-foreground p-1 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display mode ── */
                  <div className="flex items-center justify-between">
                    {isHourly ? (
                      <div>
                        <span className="text-sm font-bold tabular-nums">
                          £{displayPrice ?? 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          /hr
                        </span>
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const prices =
                            svc.currentSizePrices ??
                            svc.recommendedSizePrices ??
                            {};
                          const stdPrice =
                            prices["standard"] ?? prices["small"] ?? 0;
                          return (
                            <span className="text-sm font-bold tabular-nums">
                              from £{stdPrice}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(svc)}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Edit price"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Info footer ── */}
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
        <strong>How pricing works:</strong> {commissionPercent}% commission on
        your rate +{" "}
        {bookingFeeMode === "percent"
          ? `${bookingFee}% booking fee`
          : `£${bookingFee.toFixed(2)} booking fee`}{" "}
        added to customer total.
      </div>
    </div>
  );
}
