import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { getSettingValue } from "@/lib/config/env";
import {
  deletePricingConfigAction,
  disablePricingConfigAction,
  saveAreaOverrideAction,
  saveMarketplaceSettingAction,
  savePricingConfigAction,
} from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PricingOverview } from "./pricing-overview";
import { BookingFeeForm } from "./booking-fee-form";
import { getAdminTranslations } from "@/lib/i18n/server";

export default async function AdminPricingPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");
  const t = await getAdminTranslations();

  const prisma = getPrisma();
  const providers = await prisma.providerCompany.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pricingRules: { orderBy: { serviceKey: "asc" } },
    },
  });

  const bookingFeeSetting = await prisma.adminSetting.findUnique({
    where: { key: "marketplace.booking_fee" },
  });
  const bookingFeeModeSetting = await prisma.adminSetting.findUnique({
    where: { key: "marketplace.booking_fee_mode" },
  });
  const commissionSetting = await prisma.adminSetting.findUnique({
    where: { key: "marketplace.commission_percent" },
  });

  // Build data for client component
  const allCategories = [...new Set(providers.flatMap((p) => p.pricingRules.map((r) => r.categoryKey)))].sort();

  const providersData = providers.map((p) => ({
    id: p.id,
    tradingName: p.tradingName,
    legalName: p.legalName,
    contactEmail: p.contactEmail,
    status: p.status,
    rules: p.pricingRules.map((r) => ({
      id: r.id,
      categoryKey: r.categoryKey,
      serviceKey: r.serviceKey,
      pricingMode: r.pricingMode,
      flatPrice: r.flatPrice ? Number(r.flatPrice) : null,
      hourlyPrice: r.hourlyPrice ? Number(r.hourlyPrice) : null,
      minimumCharge: r.minimumCharge ? Number(r.minimumCharge) : null,
      travelFee: r.travelFee ? Number(r.travelFee) : null,
      sameDayUplift: r.sameDayUplift ? Number(r.sameDayUplift) : null,
      weekendUplift: r.weekendUplift ? Number(r.weekendUplift) : null,
      customQuoteRequired: r.customQuoteRequired,
      active: r.active,
      pricingJson: (r.pricingJson as Record<string, number> | null) ?? null,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.pricing.title}</h1>
        <p className="text-muted-foreground">
          {t.pricing.subtitle}
        </p>
      </div>

      {/* Platform fee settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t.pricing.platformFeeSettings}</CardTitle>
          <CardDescription>
            {t.pricing.platformFeeDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <BookingFeeForm
              currentMode={getSettingValue<string>(bookingFeeModeSetting, "fixed")}
              currentValue={getSettingValue<number>(bookingFeeSetting, 12)}
              saveAction={saveMarketplaceSettingAction}
            />
            <form action={saveMarketplaceSettingAction} className="space-y-3">
              <input type="hidden" name="key" value="marketplace.commission_percent" />
              <div>
                <Label htmlFor="commissionPercent">{t.pricing.defaultCommission}</Label>
                <Input
                  id="commissionPercent"
                  type="number"
                  step="0.01"
                  name="value"
                  defaultValue={String(
                    getSettingValue<number>(commissionSetting, 12),
                  )}
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
              >
                {t.pricing.saveCommission}
              </button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* All provider pricing overview */}
      <PricingOverview
        providers={providersData}
        categories={allCategories}
        savePricingConfigAction={savePricingConfigAction}
        disablePricingConfigAction={disablePricingConfigAction}
        deletePricingConfigAction={deletePricingConfigAction}
        saveAreaOverrideAction={saveAreaOverrideAction}
      />
    </div>
  );
}
