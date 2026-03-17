CREATE TABLE "ProviderEmailVerification" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderEmailVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProviderEmailVerification_email_purpose_idx" ON "ProviderEmailVerification"("email", "purpose");
ALTER TABLE "ProviderEmailVerification" ADD CONSTRAINT "ProviderEmailVerification_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
