import { requireProviderPricingAccess } from "@/lib/provider-auth";
import {
  listProviderPricingRules,
  saveProviderPricingRule,
} from "@/lib/pricing/prisma-pricing";
import { bulkSaveProviderPricingAction } from "./actions";
import { providerServiceCatalog } from "@/lib/providers/service-catalog-mapping";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { getPrisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PricingTable } from "@/components/provider/pricing-table";
import { PricingCalculator } from "@/components/provider/pricing-calculator";
import Link from "next/link";
import { MapPin, Info } from "lucide-react";

type ProviderPricingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderPricingPage({
  searchParams,
}: ProviderPricingPageProps) {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;
  const provider = session.providerCompany;

  const prisma = getPrisma();
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : "";

  const providerCategoryKey =
    provider.serviceCategories[0]?.categoryKey ||
    providerServiceCatalog[0]?.key ||
    "CLEANING";
  const availableServices = (
    providerServiceCatalog.find((c) => c.key === providerCategoryKey)
      ?.services || []
  ).map((s) => {
    const jobType = jobTypeCatalog.find((j) => j.value === s.key);
    return {
      key: s.key,
      label: s.label,
      recommendedHourlyRange: jobType?.recommendedHourlyRange ?? {
        min: 15,
        max: 35,
      },
      sizeOptions: jobType?.sizeOptions ?? [],
    };
  });

  // ── Auto-create pricing rules for any service that has no rule yet ─
  const existingRules = await listProviderPricingRules(providerCompanyId);
  const existingServiceKeys = new Set(existingRules.map((r) => r.serviceKey));
  const missingServices = availableServices.filter(
    (s) => !existingServiceKeys.has(s.key)
  );

  if (missingServices.length > 0) {
    await Promise.all(
      missingServices.map((s) => {
        const jobType = jobTypeCatalog.find((j) => j.value === s.key);
        const range = jobType?.recommendedHourlyRange ?? { min: 15, max: 35 };
        const midpoint = Math.round((range.min + range.max) / 2);
        const isPestControl = providerCategoryKey === "PEST_CONTROL";

        return saveProviderPricingRule({
          providerCompanyId,
          categoryKey: providerCategoryKey,
          serviceKey: s.key,
          pricingMode: isPestControl ? "fixed_per_size" : "hourly",
          hourlyPrice: isPestControl ? null : midpoint,
          pricingJson:
            isPestControl && jobType
              ? {
                  small: jobType.startingPrice,
                  standard:
                    jobType.startingPrice +
                    (jobType.sizeOptions[1]?.priceDelta ?? 30),
                  large:
                    jobType.startingPrice +
                    (jobType.sizeOptions[2]?.priceDelta ?? 60),
                }
              : undefined,
          sameDayUplift: 15,
          weekendUplift: 10,
          customQuoteRequired: false,
          active: true,
          actorType: "PROVIDER",
          actorId: providerCompanyId,
        });
      })
    );
  }

  // Re-fetch after auto-create
  const [pricingRules, bookingFeeSetting, bookingFeeModeSetting, commissionSetting] =
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
    ((bookingFeeModeSetting?.valueJson as any)?.value as string) || "fixed";
  const bookingFee = Number(
    (bookingFeeSetting?.valueJson as { value?: number } | null)?.value ?? 12
  );
  const commissionPercent = Number(
    (commissionSetting?.valueJson as { value?: number } | null)?.value ?? 12
  );

  // ── Build service rows for PricingTable ───────────────────────────
  const serviceRows = availableServices.map((s) => {
    const rule = pricingRules.find((r) => r.serviceKey === s.key);
    return {
      key: s.key,
      label: s.label,
      recommendedHourlyRange: s.recommendedHourlyRange,
      hourlyPrice: rule?.hourlyPrice != null ? Number(rule.hourlyPrice) : null,
      minimumCharge:
        rule?.minimumCharge != null ? Number(rule.minimumCharge) : null,
      sameDayUplift:
        rule?.sameDayUplift != null ? Number(rule.sameDayUplift) : null,
      weekendUplift:
        rule?.weekendUplift != null ? Number(rule.weekendUplift) : null,
      active: rule?.active ?? true,
      customQuoteRequired: rule?.customQuoteRequired ?? false,
      ruleId: rule?.id ?? null,
      pricingMode: rule?.pricingMode ?? "hourly",
      pricingJson: rule?.pricingJson ?? null,
      sizeLabels: s.sizeOptions.map((so) => ({
        value: so.value,
        label: so.label,
      })),
    };
  });

  // ── Build calculator data ─────────────────────────────────────────
  const calculatorServices = availableServices.map((s) => {
    const jobType = jobTypeCatalog.find((j) => j.value === s.key);
    return {
      key: s.key,
      label: s.label,
      sizeOptions: jobType
        ? jobType.sizeOptions.map((so) => ({
            value: so.value,
            label: so.label,
            durationHours:
              jobType.durationHours[
                so.value as keyof typeof jobType.durationHours
              ],
          }))
        : [],
      addOns: jobType?.addOns ?? [],
      recommendedHourlyRange: jobType?.recommendedHourlyRange ?? {
        min: 15,
        max: 35,
      },
    };
  });

  const calculatorRules = pricingRules.map((r) => ({
    serviceKey: r.serviceKey,
    hourlyPrice: r.hourlyPrice != null ? Number(r.hourlyPrice) : null,
    sameDayUplift: r.sameDayUplift != null ? Number(r.sameDayUplift) : null,
    weekendUplift: r.weekendUplift != null ? Number(r.weekendUplift) : null,
    active: r.active,
    pricingMode: r.pricingMode,
    pricingJson: r.pricingJson,
  }));

  const activeRules = pricingRules.filter((r) => r.active).length;
  const activeCoverage = provider.coverageAreas.filter((a) => a.active);

  // Description text
  const descriptionText =
    providerCategoryKey === "CLEANING"
      ? "Set your hourly rate or fixed prices per property size. The system estimates hours based on bedrooms and bathrooms."
      : providerCategoryKey === "PEST_CONTROL"
        ? "Set your fixed treatment prices per job size for each service."
        : "Set your hourly rate for each service. The system estimates hours based on property size.";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pricing</h1>
          <p className="text-sm text-muted-foreground">{descriptionText}</p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge variant={activeRules > 0 ? "default" : "outline"}>
            {activeRules} active{" "}
            {activeRules === 1 ? "service" : "services"}
          </Badge>
        </div>
      </div>

      {/* Coverage area banner */}
      <div className="rounded-lg border bg-blue-50/60 px-4 py-3 dark:bg-blue-950/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-blue-900 dark:text-blue-200">
              <span className="font-medium">Coverage areas:</span>{" "}
              {activeCoverage.length > 0
                ? activeCoverage.map((a) => a.postcodePrefix).join(", ")
                : "No coverage areas assigned"}
            </span>
          </div>
          <Link
            href="/provider/coverage"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap"
          >
            Manage coverage
          </Link>
        </div>
      </div>

      {status === "saved" && (
        <div className="rounded-md bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
          Changes saved successfully.
        </div>
      )}

      {/* Full-width pricing table */}
      <PricingTable
        categoryKey={providerCategoryKey}
        services={serviceRows}
        bulkSaveAction={bulkSaveProviderPricingAction}
        commissionPercent={commissionPercent}
        bookingFee={bookingFee}
        bookingFeeMode={bookingFeeMode}
      />

      {/* Collapsible calculator */}
      <PricingCalculator
        categoryKey={providerCategoryKey}
        services={calculatorServices}
        pricingRules={calculatorRules}
        bookingFee={bookingFee}
        bookingFeeMode={bookingFeeMode}
        commissionPercent={commissionPercent}
      />
    </div>
  );
}
