"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BookingFeeForm({
  currentMode,
  currentValue,
  saveAction,
}: {
  currentMode: string;
  currentValue: number;
  saveAction: (formData: FormData) => void;
}) {
  const [mode, setMode] = useState(currentMode);

  return (
    <form action={saveAction} className="space-y-3">
      <input type="hidden" name="key" value="marketplace.booking_fee" />
      <input type="hidden" name="feeMode" value={mode} />
      <div>
        <Label>Booking fee type</Label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="fixed">Fixed amount (&pound;)</option>
          <option value="percent">Percentage of base price (%)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="bookingFee">
          {mode === "fixed" ? "Amount (\u00a3)" : "Percentage (%)"}
        </Label>
        <Input
          id="bookingFee"
          type="number"
          step="0.01"
          name="value"
          defaultValue={String(currentValue)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {mode === "fixed"
            ? "A flat fee added to every booking (e.g. \u00a312)."
            : "A percentage of the provider\u2019s base price (e.g. 5 = 5%)."}
        </p>
      </div>
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
      >
        Save booking fee
      </button>
    </form>
  );
}
