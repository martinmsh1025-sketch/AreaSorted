import "dotenv/config";
import { getPrisma } from "@/lib/db";
import {
  deleteProviderPricingRule,
  disableProviderPricingRule,
  listPricingAuditLogs,
  previewProviderPricing,
  savePricingAreaOverride,
  saveProviderPricingRule,
} from "@/lib/pricing/prisma-pricing";

async function main() {
  const prisma = getPrisma();
  const provider = await prisma.providerCompany.findUnique({ where: { companyNumber: "AS-DEMO-001" } });
  if (!provider) throw new Error("Seeded provider not found");

  await prisma.pricingAreaOverride.deleteMany({ where: { providerCompanyId: provider.id, postcodePrefix: "HA5" } });
  await prisma.providerPricingRule.deleteMany({ where: { providerCompanyId: provider.id, serviceKey: { in: ["window-cleaning-interior", "custom-quote-demo"] } } });

  const created = await saveProviderPricingRule({
    providerCompanyId: provider.id,
    categoryKey: "CLEANING",
    serviceKey: "window-cleaning-interior",
    pricingMode: "flat",
    flatPrice: 42,
    hourlyPrice: 0,
    minimumCharge: 42,
    travelFee: 4,
    sameDayUplift: 10,
    weekendUplift: 8,
    customQuoteRequired: false,
    active: true,
    actorType: "ADMIN",
    actorId: "admin-proof",
  });

  const edited = await saveProviderPricingRule({
    providerCompanyId: provider.id,
    categoryKey: "CLEANING",
    serviceKey: "window-cleaning-interior",
    pricingMode: "flat",
    flatPrice: 45,
    hourlyPrice: 0,
    minimumCharge: 45,
    travelFee: 5,
    sameDayUplift: 12,
    weekendUplift: 9,
    customQuoteRequired: false,
    active: true,
    actorType: "ADMIN",
    actorId: "admin-proof",
  });

  const customQuoteRule = await saveProviderPricingRule({
    providerCompanyId: provider.id,
    categoryKey: "CLEANING",
    serviceKey: "custom-quote-demo",
    pricingMode: "flat",
    flatPrice: 80,
    hourlyPrice: 0,
    minimumCharge: 80,
    travelFee: 0,
    sameDayUplift: 0,
    weekendUplift: 0,
    customQuoteRequired: true,
    active: true,
    actorType: "ADMIN",
    actorId: "admin-proof",
  });

  const override = await savePricingAreaOverride({
    providerCompanyId: provider.id,
    categoryKey: "CLEANING",
    postcodePrefix: "HA5",
    surchargeAmount: 14,
    bookingFeeOverride: 18,
    commissionPercentOverride: 25,
    active: true,
    actorType: "ADMIN",
    actorId: "admin-proof",
  });

  const areaPreview = await previewProviderPricing({
    providerCompanyId: provider.id,
    categoryKey: "CLEANING",
    serviceKey: "window-cleaning-interior",
    postcodePrefix: "HA5",
    estimatedHours: 1,
    quantity: 1,
    sameDay: false,
    weekend: false,
  });

  const quoteRequiredPreview = await previewProviderPricing({
    providerCompanyId: provider.id,
    categoryKey: "CLEANING",
    serviceKey: "custom-quote-demo",
    postcodePrefix: "SW6",
    estimatedHours: 1,
    quantity: 1,
    sameDay: false,
    weekend: false,
  });

  const disabled = await disableProviderPricingRule({
    providerPricingRuleId: edited.id,
    actorType: "ADMIN",
    actorId: "admin-proof",
  });

  await deleteProviderPricingRule({
    providerPricingRuleId: customQuoteRule.id,
    actorType: "ADMIN",
    actorId: "admin-proof",
  });

  const deletedExists = await prisma.providerPricingRule.findUnique({ where: { id: customQuoteRule.id } });
  const auditLogs = await listPricingAuditLogs(provider.id);

  console.log(JSON.stringify({
    createdRule: {
      id: created.id,
      serviceKey: created.serviceKey,
      flatPrice: Number(created.flatPrice),
    },
    editedRule: {
      id: edited.id,
      flatPrice: Number(edited.flatPrice),
      travelFee: Number(edited.travelFee),
    },
    disabledRule: {
      id: disabled.id,
      active: disabled.active,
    },
    deletedRuleStillExists: Boolean(deletedExists),
    areaOverridePreview: areaPreview,
    quoteRequiredPreview,
    recentAuditLogs: auditLogs.slice(0, 6).map((log) => ({
      action: log.action,
      actorType: log.actorType,
      createdAt: log.createdAt.toISOString(),
      hasBefore: Boolean(log.beforeJson),
      hasAfter: Boolean(log.afterJson),
    })),
    areaOverride: {
      postcodePrefix: override.postcodePrefix,
      surchargeAmount: Number(override.surchargeAmount),
      bookingFeeOverride: Number(override.bookingFeeOverride),
      commissionPercentOverride: Number(override.commissionPercentOverride),
    },
  }, null, 2));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  const prisma = getPrisma();
  await prisma.$disconnect();
  process.exit(1);
});
