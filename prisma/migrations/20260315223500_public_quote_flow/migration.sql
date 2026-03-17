-- CreateEnum
CREATE TYPE "PublicQuoteState" AS ENUM ('DRAFT', 'PRICED', 'MANUAL_REVIEW_REQUIRED', 'REQUEST_SUBMITTED', 'BOOKING_CREATED', 'EXPIRED');

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "postcodePrefix" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "providerCompanyId" TEXT,
    "bookingId" TEXT,
    "state" "PublicQuoteState" NOT NULL DEFAULT 'DRAFT',
    "quoteRequired" BOOLEAN NOT NULL DEFAULT false,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTimeLabel" TEXT,
    "inputJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotePriceSnapshot" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "providerCompanyId" TEXT,
    "pricingRuleId" TEXT,
    "providerBasePrice" DECIMAL(10,2) NOT NULL,
    "bookingFee" DECIMAL(10,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "postcodeSurcharge" DECIMAL(10,2) NOT NULL,
    "totalCustomerPay" DECIMAL(10,2) NOT NULL,
    "expectedProviderPayoutBeforeFees" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimatedHours" DECIMAL(5,2) NOT NULL,
    "sameDay" BOOLEAN NOT NULL DEFAULT false,
    "weekend" BOOLEAN NOT NULL DEFAULT false,
    "quoteRequired" BOOLEAN NOT NULL DEFAULT false,
    "inputJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotePriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_reference_key" ON "QuoteRequest"("reference");
CREATE UNIQUE INDEX "QuoteRequest_bookingId_key" ON "QuoteRequest"("bookingId");
CREATE INDEX "QuoteRequest_postcode_idx" ON "QuoteRequest"("postcode");
CREATE INDEX "QuoteRequest_postcodePrefix_idx" ON "QuoteRequest"("postcodePrefix");
CREATE INDEX "QuoteRequest_categoryKey_idx" ON "QuoteRequest"("categoryKey");
CREATE INDEX "QuoteRequest_serviceKey_idx" ON "QuoteRequest"("serviceKey");
CREATE INDEX "QuoteRequest_state_idx" ON "QuoteRequest"("state");
CREATE UNIQUE INDEX "QuotePriceSnapshot_quoteRequestId_key" ON "QuotePriceSnapshot"("quoteRequestId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuotePriceSnapshot" ADD CONSTRAINT "QuotePriceSnapshot_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
