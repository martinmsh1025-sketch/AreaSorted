-- CreateTable
CREATE TABLE "PricingAreaOverride" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "postcodePrefix" TEXT NOT NULL,
    "surchargeAmount" DECIMAL(10,2) NOT NULL,
    "bookingFeeOverride" DECIMAL(10,2),
    "commissionPercentOverride" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingAreaOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAuditLog" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "providerPricingRuleId" TEXT,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingAreaOverride_providerCompanyId_categoryKey_postcodePrefix_key" ON "PricingAreaOverride"("providerCompanyId", "categoryKey", "postcodePrefix");
CREATE INDEX "PricingAuditLog_providerCompanyId_idx" ON "PricingAuditLog"("providerCompanyId");
CREATE INDEX "PricingAuditLog_providerPricingRuleId_idx" ON "PricingAuditLog"("providerPricingRuleId");

-- AddForeignKey
ALTER TABLE "PricingAreaOverride" ADD CONSTRAINT "PricingAreaOverride_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PricingAuditLog" ADD CONSTRAINT "PricingAuditLog_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PricingAuditLog" ADD CONSTRAINT "PricingAuditLog_providerPricingRuleId_fkey" FOREIGN KEY ("providerPricingRuleId") REFERENCES "ProviderPricingRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
