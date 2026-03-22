import { requireProviderPricingAccess } from "@/lib/provider-auth";
import { listProviderPricingRules } from "@/lib/pricing/prisma-pricing";
import { acceptAllRecommendedAction, saveSinglePriceAction } from "./actions";
import { providerServiceCatalog } from "@/lib/providers/service-catalog-mapping";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { getPrisma } from "@/lib/db";
import { getSettingValue } from "@/lib/config/env";
import { Badge } from "@/components/ui/badge";
import {
  SimplePricingCards,
  type SimplePricingService,
} from "@/components/provider/simple-pricing-cards";
import { PricingCalculator } from "@/components/provider/pricing-calculator";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { groupPostcodePrefixes } from "@/lib/postcodes/group-prefixes";

export default async function ProviderPricingPage() {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;
  const provider = session.providerCompany;

  const prisma = getPrisma();

  const providerCategoryKey =
    provider.serviceCategories[0]?.categoryKey ||
    providerServiceCatalog[0]?.key ||
    "CLEANING";

  // Get services for this provider's category
  const categoryServices =
    providerServiceCatalog.find((c) => c.key === providerCategoryKey)
      ?.services || [];

  const isPestControl = providerCategoryKey === "PEST_CONTROL";

  // Fetch existing rules + platform settings
  const [existingRules, bookingFeeSetting, bookingFeeModeSetting, commissionSetting] =
    await Promise.all([
      listProviderPricingRules(providerCompanyId),
      prisma.adminSetting.findUnique({
        where: { key: "marketplace.booking_fee" },
      }),
      prisma.adminSetting.findUnique({
        where: { key: "marketplace.booking_fee_mode" },
      }),
      prisma.adminSetting.findUnique({
        where: { key: "marketplace.commission_percent" },
      }),
    ]);

  const bookingFeeMode =
    getSettingValue<string>(bookingFeeModeSetting, "fixed");
  const bookingFee = Number(
    getSettingValue<number>(bookingFeeSetting, 12)
  );
  const commissionPercent = Number(
    getSettingValue<number>(commissionSetting, 12)
  );

  // Build simplified service list
  const services: SimplePricingService[] = categoryServices.map((s) => {
    const jobType = jobTypeCatalog.find((j) => j.value === s.key);
    const range = jobType?.recommendedHourlyRange ?? { min: 15, max: 35 };
    const midpoint = Math.round((range.min + range.max) / 2);
    const existingRule = existingRules.find((r) => r.serviceKey === s.key);
    const pricingMode = isPestControl ? "fixed_per_size" : "hourly";

    // Build recommended size prices for fixed_per_size mode
    let recommendedSizePrices: Record<string, number> | null = null;
    if (isPestControl && jobType) {
      recommendedSizePrices = {
        small: jobType.startingPrice,
        standard:
          jobType.startingPrice +
          (jobType.sizeOptions[1]?.priceDelta ?? 30),
        large:
          jobType.startingPrice +
          (jobType.sizeOptions[2]?.priceDelta ?? 60),
      };
    }

    // Parse existing rule's size prices
    let currentSizePrices: Record<string, number> | null = null;
    if (existingRule?.pricingJson && typeof existingRule.pricingJson === "object") {
      currentSizePrices = {};
      for (const [k, v] of Object.entries(existingRule.pricingJson)) {
        currentSizePrices[k] = Number(v) || 0;
      }
    }

    return {
      key: s.key,
      label: s.label,
      categoryKey: providerCategoryKey,
      pricingMode: existingRule?.pricingMode ?? pricingMode,
      recommendedHourlyPrice: isPestControl ? null : midpoint,
      recommendedHourlyRange: range,
      recommendedSizePrices,
      currentHourlyPrice:
        existingRule?.hourlyPrice != null
          ? Number(existingRule.hourlyPrice)
          : null,
      currentSizePrices,
      sizeLabels: (jobType?.sizeOptions ?? []).map((so) => ({
        value: so.value,
        label: so.label,
      })),
      isActive: existingRule?.active ?? false,
      hasExistingRule: !!existingRule,
    };
  });

  const activeCount = existingRules.filter((r) => r.active).length;
  const allAccepted =
    activeCount > 0 && activeCount >= services.length;
  const activeCoverage = provider.coverageAreas.filter((a) => a.active);
  const groupedCoverage = groupPostcodePrefixes(activeCoverage.map((a) => a.postcodePrefix));

  // Build calculator props — services with full catalog info + pricing rules
  const calculatorServices = categoryServices.map((s) => {
    const jobType = jobTypeCatalog.find((j) => j.value === s.key);
    return {
      key: s.key,
      label: s.label,
      sizeOptions: (jobType?.sizeOptions ?? []).map((so) => ({
        value: so.value,
        label: so.label,
        durationHours: jobType?.durationHours?.[so.value as keyof typeof jobType.durationHours] ?? 2,
      })),
      addOns: jobType?.addOns ?? [],
      recommendedHourlyRange: jobType?.recommendedHourlyRange ?? { min: 15, max: 35 },
    };
  });

  const calculatorRules = existingRules
    .filter((r) => categoryServices.some((s) => s.key === r.serviceKey))
    .map((r) => ({
      serviceKey: r.serviceKey,
      hourlyPrice: r.hourlyPrice,
      sameDayUplift: r.sameDayUplift,
      weekendUplift: r.weekendUplift,
      active: r.active,
      pricingMode: r.pricingMode,
      pricingJson: r.pricingJson,
    }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pricing</h1>
          <p className="text-sm text-muted-foreground">
            Set your prices for each service. We recommend competitive rates
            based on London market data.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge variant={activeCount > 0 ? "default" : "outline"}>
            {activeCount} active{" "}
            {activeCount === 1 ? "service" : "services"}
          </Badge>
        </div>
      </div>

      {/* Coverage area banner */}
      <div className="rounded-lg border bg-blue-50/60 px-4 py-3 dark:bg-blue-950/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-blue-900 dark:text-blue-200">
              <div className="font-medium">Coverage areas</div>
              {groupedCoverage.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {groupedCoverage.map((group) => (
                    <div key={group.areaKey} className="rounded-md border border-blue-200/60 bg-white/70 px-3 py-2 dark:border-blue-800/50 dark:bg-blue-950/20">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{group.areaName}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {group.prefixes.map((prefix) => (
                          <span key={prefix} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                            {prefix}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1">No coverage areas assigned</div>
              )}
            </div>
          </div>
          <Link
            href="/provider/coverage"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap"
          >
            Manage coverage
          </Link>
        </div>
      </div>

      {/* Two-column layout: pricing cards (left) + calculator (right) */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Left: Pricing cards */}
        <div className="min-w-0">
          <SimplePricingCards
            services={services}
            commissionPercent={commissionPercent}
            bookingFee={bookingFee}
            bookingFeeMode={bookingFeeMode}
            acceptAllAction={acceptAllRecommendedAction}
            saveSingleAction={saveSinglePriceAction}
            allAccepted={allAccepted}
          />
        </div>

        {/* Right: Price calculator — sticky, always visible */}
        {activeCount > 0 && (
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <PricingCalculator
                categoryKey={providerCategoryKey}
                services={calculatorServices}
                pricingRules={calculatorRules}
                bookingFee={bookingFee}
                bookingFeeMode={bookingFeeMode}
                commissionPercent={commissionPercent}
              />
            </div>
          </div>
        )}
      </div>

      {/* Calculator on mobile — shown below cards */}
      {activeCount > 0 && (
        <div className="lg:hidden">
          <PricingCalculator
            categoryKey={providerCategoryKey}
            services={calculatorServices}
            pricingRules={calculatorRules}
            bookingFee={bookingFee}
            bookingFeeMode={bookingFeeMode}
            commissionPercent={commissionPercent}
          />
        </div>
      )}
    </div>
  );
}
