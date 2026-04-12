"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/context";

export function BookingFeeForm({
  currentMode,
  currentValue,
  saveAction,
}: {
  currentMode: string;
  currentValue: number;
  saveAction: (formData: FormData) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState(currentMode);

  return (
    <form action={saveAction} className="space-y-3">
      <input type="hidden" name="key" value="marketplace.booking_fee" />
      <input type="hidden" name="feeMode" value={mode} />
      <div>
        <Label>{t.bookingFeeForm.bookingFeeType}</Label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="fixed">{t.bookingFeeForm.fixedAmount}</option>
          <option value="percent">{t.bookingFeeForm.percentageOfBase}</option>
        </select>
      </div>
      <div>
        <Label htmlFor="bookingFee">
          {mode === "fixed" ? t.bookingFeeForm.amountLabel : t.bookingFeeForm.percentageLabel}
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
            ? t.bookingFeeForm.flatFeeHelp
            : t.bookingFeeForm.percentageHelp}
        </p>
      </div>
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
      >
        {t.bookingFeeForm.saveBookingFee}
      </button>
    </form>
  );
}
