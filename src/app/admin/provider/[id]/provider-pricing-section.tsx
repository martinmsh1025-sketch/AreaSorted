"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PricingRule = {
  id: string;
  categoryKey: string;
  serviceKey: string;
  pricingMode: string;
  flatPrice: number | null;
  hourlyPrice: number | null;
  minimumCharge: number | null;
  travelFee: number | null;
  sameDayUplift: number | null;
  weekendUplift: number | null;
  customQuoteRequired: boolean;
  active: boolean;
  pricingJson: Record<string, number> | null;
};

type ProviderPricingSectionProps = {
  providerCompanyId: string;
  providerName: string;
  rules: PricingRule[];
  savePricingConfigAction: (formData: FormData) => void;
  disablePricingConfigAction: (formData: FormData) => void;
  deletePricingConfigAction: (formData: FormData) => void;
  saveAreaOverrideAction: (formData: FormData) => void;
};

function formatMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function pricingModeLabel(mode: string) {
  switch (mode) {
    case "hourly": return "Hourly";
    case "flat": return "Flat";
    case "fixed_per_size": return "Per size";
    case "minimum": return "Minimum";
    default: return mode;
  }
}

function PricingJsonDisplay({ json }: { json: Record<string, number> | null }) {
  if (!json || Object.keys(json).length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {Object.entries(json).map(([size, price]) => (
        <span key={size} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
          <span className="capitalize">{size}</span>
          <span className="font-semibold tabular-nums">{formatMoney(price)}</span>
        </span>
      ))}
    </div>
  );
}

export function ProviderPricingSection({
  providerCompanyId,
  providerName,
  rules,
  savePricingConfigAction,
  disablePricingConfigAction,
  deletePricingConfigAction,
  saveAreaOverrideAction,
}: ProviderPricingSectionProps) {
  const [showEditForms, setShowEditForms] = useState(false);

  const activeRules = rules.filter((r) => r.active).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pricing rules</CardTitle>
            <CardDescription>
              {rules.length === 0
                ? "No pricing rules configured yet."
                : `${activeRules} active / ${rules.length} total rules`}
            </CardDescription>
          </div>
          {rules.length > 0 && (
            <button
              type="button"
              onClick={() => setShowEditForms(!showEditForms)}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              {showEditForms ? "Hide editor" : "Edit rules"}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center py-4">
              This provider has not set up any pricing rules yet.
            </p>
            {/* Add new rule form even when empty */}
            <AddRuleForm
              providerCompanyId={providerCompanyId}
              providerName={providerName}
              savePricingConfigAction={savePricingConfigAction}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Service</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Mode</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Hourly</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Flat</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Min charge</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Travel</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Size tiers</th>
                    <th className="pb-2 font-medium text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium">{rule.serviceKey.replace(/-/g, " ")}</div>
                        <div className="text-xs text-muted-foreground">{rule.categoryKey}</div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {pricingModeLabel(rule.pricingMode)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {rule.hourlyPrice ? formatMoney(Number(rule.hourlyPrice)) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {rule.flatPrice ? formatMoney(Number(rule.flatPrice)) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {rule.minimumCharge ? formatMoney(Number(rule.minimumCharge)) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {rule.travelFee ? formatMoney(Number(rule.travelFee)) : "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <PricingJsonDisplay json={rule.pricingJson} />
                      </td>
                      <td className="py-2.5 text-center">
                        {rule.active ? (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Off</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded edit forms */}
            {showEditForms && (
              <div className="space-y-6">
                <Separator />

                {/* Existing rules inline edit */}
                <div className="space-y-4">
                  <p className="text-sm font-medium">Edit rules</p>
                  {rules.map((rule) => (
                    <div key={rule.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {rule.categoryKey} / {rule.serviceKey}
                        </p>
                        <Badge variant={rule.active ? "default" : "outline"}>
                          {rule.active ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <form action={savePricingConfigAction} className="grid gap-3 sm:grid-cols-12">
                        <input type="hidden" name="providerCompanyId" value={providerCompanyId} />
                        <input type="hidden" name="categoryKey" value={rule.categoryKey} />
                        <input type="hidden" name="serviceKey" value={rule.serviceKey} />
                        <div className="sm:col-span-3">
                          <Label>Mode</Label>
                          <select
                            name="pricingMode"
                            defaultValue={rule.pricingMode}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="flat">Flat</option>
                            <option value="hourly">Hourly</option>
                            <option value="minimum">Minimum</option>
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <Label>Flat price</Label>
                          <Input type="number" step="0.01" name="flatPrice" defaultValue={rule.flatPrice ? String(rule.flatPrice) : ""} />
                        </div>
                        <div className="sm:col-span-3">
                          <Label>Hourly</Label>
                          <Input type="number" step="0.01" name="hourlyPrice" defaultValue={rule.hourlyPrice ? String(rule.hourlyPrice) : ""} />
                        </div>
                        <div className="sm:col-span-3">
                          <Label>Min charge</Label>
                          <Input type="number" step="0.01" name="minimumCharge" defaultValue={rule.minimumCharge ? String(rule.minimumCharge) : ""} />
                        </div>
                        <div className="sm:col-span-3">
                          <Label>Travel fee</Label>
                          <Input type="number" step="0.01" name="travelFee" defaultValue={rule.travelFee ? String(rule.travelFee) : ""} />
                        </div>
                        <div className="sm:col-span-3">
                          <Label>Same-day</Label>
                          <Input type="number" step="0.01" name="sameDayUplift" defaultValue={rule.sameDayUplift ? String(rule.sameDayUplift) : ""} />
                        </div>
                        <div className="sm:col-span-3">
                          <Label>Weekend</Label>
                          <Input type="number" step="0.01" name="weekendUplift" defaultValue={rule.weekendUplift ? String(rule.weekendUplift) : ""} />
                        </div>
                        <div className="sm:col-span-3 flex items-end gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="customQuoteRequired" defaultChecked={rule.customQuoteRequired} className="rounded" />
                            Quote
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="active" defaultChecked={rule.active} className="rounded" />
                            Active
                          </label>
                        </div>
                        <div className="sm:col-span-12 flex gap-2">
                          <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
                            Save
                          </button>
                        </div>
                      </form>
                      <div className="flex gap-2">
                        <form action={disablePricingConfigAction}>
                          <input type="hidden" name="providerPricingRuleId" value={rule.id} />
                          <button type="submit" className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-muted">
                            {rule.active ? "Disable" : "Enable"}
                          </button>
                        </form>
                        <form action={deletePricingConfigAction}>
                          <input type="hidden" name="providerPricingRuleId" value={rule.id} />
                          <button type="submit" className="inline-flex h-8 items-center justify-center rounded-md border border-destructive/50 bg-background px-3 text-xs font-medium text-destructive shadow-sm hover:bg-destructive/10">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new rule */}
                <AddRuleForm
                  providerCompanyId={providerCompanyId}
                  providerName={providerName}
                  savePricingConfigAction={savePricingConfigAction}
                />

                {/* Area override */}
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <p className="text-sm font-medium">Area-level override</p>
                  <form action={saveAreaOverrideAction} className="grid gap-3 sm:grid-cols-12">
                    <input type="hidden" name="providerCompanyId" value={providerCompanyId} />
                    <div className="sm:col-span-3">
                      <Label>Category</Label>
                      <Input name="categoryKey" placeholder="CLEANING" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Postcode prefix</Label>
                      <Input name="postcodePrefix" placeholder="SW6" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Surcharge</Label>
                      <Input type="number" step="0.01" name="surchargeAmount" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Fee override</Label>
                      <Input type="number" step="0.01" name="bookingFeeOverride" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Comm % override</Label>
                      <Input type="number" step="0.01" name="commissionPercentOverride" />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <label className="flex items-center gap-1 text-sm">
                        <input type="checkbox" name="active" defaultChecked className="rounded" />
                        On
                      </label>
                    </div>
                    <div className="sm:col-span-12">
                      <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
                        Save area override
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddRuleForm({
  providerCompanyId,
  providerName,
  savePricingConfigAction,
}: {
  providerCompanyId: string;
  providerName: string;
  savePricingConfigAction: (formData: FormData) => void;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <p className="text-sm font-medium">Add new rule for {providerName}</p>
      <form action={savePricingConfigAction} className="grid gap-3 sm:grid-cols-12">
        <input type="hidden" name="providerCompanyId" value={providerCompanyId} />
        <div className="sm:col-span-3">
          <Label>Category</Label>
          <Input name="categoryKey" placeholder="CLEANING" />
        </div>
        <div className="sm:col-span-3">
          <Label>Service key</Label>
          <Input name="serviceKey" placeholder="regular-home-cleaning" />
        </div>
        <div className="sm:col-span-3">
          <Label>Pricing mode</Label>
          <select name="pricingMode" defaultValue="flat" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="flat">Flat</option>
            <option value="hourly">Hourly</option>
            <option value="minimum">Minimum</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <Label>Flat price</Label>
          <Input type="number" step="0.01" name="flatPrice" />
        </div>
        <div className="sm:col-span-3">
          <Label>Hourly price</Label>
          <Input type="number" step="0.01" name="hourlyPrice" />
        </div>
        <div className="sm:col-span-3">
          <Label>Min charge</Label>
          <Input type="number" step="0.01" name="minimumCharge" />
        </div>
        <div className="sm:col-span-2">
          <Label>Travel fee</Label>
          <Input type="number" step="0.01" name="travelFee" />
        </div>
        <div className="sm:col-span-2">
          <Label>Same-day uplift</Label>
          <Input type="number" step="0.01" name="sameDayUplift" />
        </div>
        <div className="sm:col-span-2">
          <Label>Weekend uplift</Label>
          <Input type="number" step="0.01" name="weekendUplift" />
        </div>
        <div className="sm:col-span-3 flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="customQuoteRequired" className="rounded" />
            Quote required
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked className="rounded" />
            Active
          </label>
        </div>
        <div className="sm:col-span-3 flex items-end">
          <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90">
            Save rule
          </button>
        </div>
      </form>
    </div>
  );
}
