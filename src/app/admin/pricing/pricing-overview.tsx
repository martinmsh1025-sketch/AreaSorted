"use client";

import { useState, useMemo } from "react";
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

type Provider = {
  id: string;
  tradingName: string | null;
  legalName: string | null;
  contactEmail: string;
  status: string;
  rules: PricingRule[];
};

type PricingOverviewProps = {
  providers: Provider[];
  categories: string[];
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

export function PricingOverview({
  providers,
  categories,
  savePricingConfigAction,
  disablePricingConfigAction,
  deletePricingConfigAction,
  saveAreaOverrideAction,
}: PricingOverviewProps) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Build a flat list of all rules with provider info
  const allRules = useMemo(() => {
    return providers.flatMap((p) =>
      p.rules.map((r) => ({
        ...r,
        providerId: p.id,
        providerName: p.tradingName || p.legalName || p.contactEmail,
        providerStatus: p.status,
      }))
    );
  }, [providers]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    const min = priceMin ? parseFloat(priceMin) : null;
    const max = priceMax ? parseFloat(priceMax) : null;

    return allRules.filter((r) => {
      if (filterCategory !== "all" && r.categoryKey !== filterCategory) return false;
      if (filterProvider !== "all" && r.providerId !== filterProvider) return false;
      if (filterStatus === "active" && !r.active) return false;
      if (filterStatus === "disabled" && r.active) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          r.providerName.toLowerCase().includes(q) ||
          r.categoryKey.toLowerCase().includes(q) ||
          r.serviceKey.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Price range filter — checks hourly, flat, minimumCharge, and pricingJson values
      if (min !== null || max !== null) {
        const prices: number[] = [];
        if (r.hourlyPrice) prices.push(Number(r.hourlyPrice));
        if (r.flatPrice) prices.push(Number(r.flatPrice));
        if (r.minimumCharge) prices.push(Number(r.minimumCharge));
        if (r.pricingJson) {
          Object.values(r.pricingJson).forEach((v) => {
            if (typeof v === "number") prices.push(v);
          });
        }
        if (prices.length === 0) return false;
        const highest = Math.max(...prices);
        const lowest = Math.min(...prices);
        if (min !== null && highest < min) return false;
        if (max !== null && lowest > max) return false;
      }
      return true;
    });
  }, [allRules, filterCategory, filterProvider, filterStatus, search, priceMin, priceMax]);

  // Group filtered rules by provider
  const groupedByProvider = useMemo(() => {
    const map = new Map<string, { provider: Provider; rules: typeof filteredRules }>();
    for (const rule of filteredRules) {
      const p = providers.find((p) => p.id === rule.providerId)!;
      if (!map.has(p.id)) {
        map.set(p.id, { provider: p, rules: [] });
      }
      map.get(p.id)!.rules.push(rule);
    }
    return Array.from(map.values());
  }, [filteredRules, providers]);

  // Stats
  const totalRules = allRules.length;
  const activeRules = allRules.filter((r) => r.active).length;
  const providersWithRules = new Set(allRules.map((r) => r.providerId)).size;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total rules</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{totalRules}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active rules</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-green-600">{activeRules}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disabled rules</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-muted-foreground">{totalRules - activeRules}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Providers with pricing</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{providersWithRules} / {providers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-6">
            <div>
              <Label className="text-xs text-muted-foreground">Search</Label>
              <Input
                placeholder="Provider, category, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Provider</Label>
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All providers</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.tradingName || p.legalName || p.contactEmail}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All</option>
                <option value="active">Active only</option>
                <option value="disabled">Disabled only</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Min price (&pound;)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max price (&pound;)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Any"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing rules table */}
      {groupedByProvider.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {totalRules === 0
              ? "No pricing rules found. Providers need to set up their pricing first."
              : "No rules match your filters."}
          </CardContent>
        </Card>
      ) : (
        groupedByProvider.map(({ provider, rules }) => (
          <Card key={provider.id}>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() =>
                setExpandedProvider(expandedProvider === provider.id ? null : provider.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {expandedProvider === provider.id ? "▾" : "▸"}
                  </span>
                  <div>
                    <CardTitle className="text-base">
                      {provider.tradingName || provider.legalName || provider.contactEmail}
                    </CardTitle>
                    <CardDescription>{provider.contactEmail}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={provider.status === "ACTIVE" ? "default" : "secondary"}>
                    {provider.status}
                  </Badge>
                  <Badge variant="outline">
                    {rules.filter((r) => r.active).length} active / {rules.length} rules
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {/* Always show pricing summary table */}
            <CardContent className="pt-0">
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

              {/* Expanded: edit forms + admin tools */}
              {expandedProvider === provider.id && (
                <div className="mt-6 space-y-6">
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
                          <input type="hidden" name="providerCompanyId" value={provider.id} />
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

                  {/* Create new rule */}
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium">Add new rule for {provider.tradingName || provider.contactEmail}</p>
                    <form action={savePricingConfigAction} className="grid gap-3 sm:grid-cols-12">
                      <input type="hidden" name="providerCompanyId" value={provider.id} />
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

                  {/* Area override */}
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium">Area-level override</p>
                    <form action={saveAreaOverrideAction} className="grid gap-3 sm:grid-cols-12">
                      <input type="hidden" name="providerCompanyId" value={provider.id} />
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
            </CardContent>
          </Card>
        ))
      )}

      {/* Providers with NO rules */}
      {providers.filter((p) => p.rules.length === 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Providers without pricing</CardTitle>
            <CardDescription>These providers have not set up any pricing rules yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {providers
                .filter((p) => p.rules.length === 0)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">
                        {p.tradingName || p.legalName || p.contactEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.contactEmail}</p>
                    </div>
                    <Badge variant="secondary">{p.status}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
