import "dotenv/config";
import { getPrisma } from "@/lib/db";
import { activateProviderCompany, getProviderActivationCheck } from "@/server/services/providers/activation";

async function main() {
  const prisma = getPrisma();

  const complete = await prisma.providerCompany.upsert({
    where: { companyNumber: "AS-DEMO-001" },
    update: {
      status: "PROFILE_STARTED",
      paymentReady: false,
    },
    create: {
      legalName: "AreaSorted Demo Provider Ltd",
      tradingName: "Demo Provider",
      companyNumber: "AS-DEMO-001",
      registeredAddress: "1 Demo Street, London",
      contactEmail: "provider@example.com",
      phone: "02000000000",
      status: "PROFILE_STARTED",
    },
  });

  const incomplete = await prisma.providerCompany.upsert({
    where: { companyNumber: "AS-DEMO-002" },
    update: {
      status: "PROFILE_STARTED",
      paymentReady: false,
    },
    create: {
      legalName: "AreaSorted Incomplete Provider Ltd",
      tradingName: "Incomplete Provider",
      companyNumber: "AS-DEMO-002",
      registeredAddress: "2 Missing Street, London",
      contactEmail: "provider-incomplete@example.com",
      phone: "02000000001",
      status: "PROFILE_STARTED",
    },
  });

  await prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.providerAgreement.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });
  await prisma.stripeConnectedAccount.deleteMany({ where: { providerCompanyId: { in: [complete.id, incomplete.id] } } });

  await prisma.providerServiceCategory.create({ data: { providerCompanyId: complete.id, categoryKey: "CLEANING" } });
  await prisma.providerCoverageArea.create({ data: { providerCompanyId: complete.id, postcodePrefix: "SW6", categoryKey: "CLEANING" } });
  await prisma.providerAgreement.create({ data: { providerCompanyId: complete.id, version: "v1", status: "SIGNED", signedAt: new Date() } });
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

  const incompleteCheck = await getProviderActivationCheck(incomplete.id);
  const completeCheck = await getProviderActivationCheck(complete.id);

  let incompleteError: string[] = [];
  try {
    await activateProviderCompany(incomplete.id);
  } catch (error) {
    incompleteError = error instanceof Error && "missing" in error ? (error as any).missing : [String(error)];
  }

  await activateProviderCompany(complete.id);

  const incompleteAfter = await prisma.providerCompany.findUnique({ where: { id: incomplete.id } });
  const completeAfter = await prisma.providerCompany.findUnique({ where: { id: complete.id } });

  console.log(JSON.stringify({
    failingProvider: {
      companyNumber: incomplete.companyNumber,
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
