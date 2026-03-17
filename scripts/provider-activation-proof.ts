import "dotenv/config";
import { getPrisma } from "@/lib/db";
import { activateProviderCompany, getProviderActivationCheck } from "@/server/services/providers/activation";

async function main() {
  const prisma = getPrisma();

  const complete = await prisma.providerCompany.upsert({
    where: { companyNumber: "AS-DEMO-001" },
    update: {
      status: "PRICING_PENDING",
      paymentReady: false,
      emailVerifiedAt: new Date(),
      passwordSetAt: new Date(),
      onboardingSubmittedAt: new Date(),
      approvedAt: new Date(),
      legalName: "AreaSorted Demo Provider Ltd",
      tradingName: "Demo Provider",
      companyNumber: "AS-DEMO-001",
      registeredAddress: "1 Demo Street, London",
      contactEmail: "provider@example.com",
      phone: "02000000000",
    },
    create: {
      legalName: "AreaSorted Demo Provider Ltd",
      tradingName: "Demo Provider",
      companyNumber: "AS-DEMO-001",
      registeredAddress: "1 Demo Street, London",
      contactEmail: "provider@example.com",
      phone: "02000000000",
      status: "PRICING_PENDING",
      emailVerifiedAt: new Date(),
      passwordSetAt: new Date(),
      onboardingSubmittedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  let incomplete = await prisma.providerCompany.findFirst({ where: { contactEmail: "provider-incomplete@example.com" } });
  if (incomplete) {
    incomplete = await prisma.providerCompany.update({
      where: { id: incomplete.id },
      data: {
        status: "ONBOARDING_IN_PROGRESS",
        paymentReady: false,
        contactEmail: "provider-incomplete@example.com",
      },
    });
  } else {
    incomplete = await prisma.providerCompany.create({
      data: {
        contactEmail: "provider-incomplete@example.com",
        status: "ONBOARDING_IN_PROGRESS",
      },
    });
  }

  await prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.providerAgreement.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.stripeConnectedAccount.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.providerOnboardingDocument.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.providerPricingRule.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });

  await prisma.providerServiceCategory.create({ data: { providerCompanyId: complete.id, categoryKey: "CLEANING" } });
  await prisma.providerCoverageArea.create({ data: { providerCompanyId: complete.id, postcodePrefix: "SW6", categoryKey: "CLEANING" } });
  await prisma.providerAgreement.create({ data: { providerCompanyId: complete.id, version: "v1", status: "SIGNED", signedAt: new Date() } });
  await prisma.providerOnboardingDocument.createMany({
    data: [
      { providerCompanyId: complete.id, documentKey: "company_registration_proof", label: "Company registration proof", fileName: "company.pdf", storedFileName: "company.pdf", storagePath: "/tmp/company.pdf", status: "APPROVED" },
      { providerCompanyId: complete.id, documentKey: "insurance_proof", label: "Insurance proof", fileName: "insurance.pdf", storedFileName: "insurance.pdf", storagePath: "/tmp/insurance.pdf", status: "APPROVED" },
      { providerCompanyId: complete.id, documentKey: "representative_id_document", label: "Representative ID document", fileName: "id.pdf", storedFileName: "id.pdf", storagePath: "/tmp/id.pdf", status: "APPROVED" },
    ],
  });
  await prisma.stripeConnectedAccount.create({
    data: {
      providerCompanyId: complete.id,
      stripeAccountId: "acct_demo_activation_complete",
      mode: "EXPRESS",
      chargeModel: "DIRECT_CHARGES",
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    },
  });
  await prisma.providerPricingRule.create({
    data: {
      providerCompanyId: complete.id,
      categoryKey: "CLEANING",
      serviceKey: "regular-home-cleaning",
      pricingMode: "hourly",
      hourlyPrice: 16,
      minimumCharge: 48,
      active: true,
      customQuoteRequired: false,
    },
  });

  const incompleteCheck = await getProviderActivationCheck(incomplete.id);
  const completeCheck = await getProviderActivationCheck(complete.id);

  let incompleteError = [] as string[];
  try {
    await activateProviderCompany(incomplete.id);
  } catch (error) {
    incompleteError = error instanceof Error && "missing" in error ? (error as { missing: string[] }).missing : [String(error)];
  }

  await activateProviderCompany(complete.id);

  const incompleteAfter = await prisma.providerCompany.findUnique({ where: { id: incomplete.id } });
  const completeAfter = await prisma.providerCompany.findUnique({ where: { id: complete.id } });

  console.log(JSON.stringify({
    failingProvider: {
      companyEmail: incomplete.contactEmail,
      canActivate: incompleteCheck.canActivate,
      missing: incompleteCheck.checklist.missingLabels,
      activationBlockedWith: incompleteError,
      finalStatus: incompleteAfter?.status,
    },
    passingProvider: {
      companyNumber: complete.companyNumber,
      canActivate: completeCheck.canActivate,
      missing: completeCheck.checklist.missingLabels,
      finalStatus: completeAfter?.status,
      paymentReady: completeAfter?.paymentReady,
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
