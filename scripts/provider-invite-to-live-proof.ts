import "dotenv/config";
import { getPrisma } from "@/lib/db";
import { createProviderInvite, findProviderInviteByEmail, markProviderAgreementSigned, saveProviderDocuments, setProviderEmailVerified, setProviderPasswordSet, submitProviderForReview, updateProviderCompanyProfile, updateProviderDocumentReview, updateProviderReview } from "@/lib/providers/repository";
import { createProviderCompanyFromInvite } from "@/server/services/providers/onboarding";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";
import { saveProviderPricingRule } from "@/lib/pricing/prisma-pricing";

async function main() {
  const prisma = getPrisma();
  const email = "proof-provider@areasorted.test";

  await prisma.notificationLogV2.deleteMany({ where: { recipient: email } });
  await prisma.providerEmailVerification.deleteMany({ where: { email } });
  await prisma.providerAuthToken.deleteMany({ where: { email } });

  const existingProvider = await prisma.providerCompany.findFirst({ where: { contactEmail: email } });
  if (existingProvider) {
    await prisma.pricingAuditLog.deleteMany({ where: { providerCompanyId: existingProvider.id } });
    await prisma.providerPricingRule.deleteMany({ where: { providerCompanyId: existingProvider.id } });
    await prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: existingProvider.id } });
    await prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: existingProvider.id } });
    await prisma.providerAgreement.deleteMany({ where: { providerCompanyId: existingProvider.id } });
    await prisma.providerOnboardingDocument.deleteMany({ where: { providerCompanyId: existingProvider.id } });
    await prisma.stripeConnectedAccount.deleteMany({ where: { providerCompanyId: existingProvider.id } });
    await prisma.providerInvite.updateMany({ where: { providerCompanyId: existingProvider.id }, data: { providerCompanyId: null } });
    await prisma.providerCompany.delete({ where: { id: existingProvider.id } });
  }

  await prisma.providerInvite.deleteMany({ where: { email } });

  const invite = await createProviderInvite({
    email,
    approvedCategoryKey: "CLEANING",
    approvedServiceKeys: ["regular-home-cleaning", "deep-cleaning"],
  });

  const acceptedProvider = await createProviderCompanyFromInvite({ inviteToken: invite.token, contactEmail: email });
  await setProviderEmailVerified(acceptedProvider.id);
  await setProviderPasswordSet(acceptedProvider.id);

  await updateProviderCompanyProfile({
    providerCompanyId: acceptedProvider.id,
    businessType: "company",
    legalName: "AreaSorted Proof Provider Ltd",
    tradingName: "Proof Provider",
    companyNumber: "AS-PROOF-INVITE-001",
    registeredAddress: "1 Proof Street, London",
    contactEmail: email,
    phone: "02070000000",
    vatNumber: "GB123456789",
    categories: ["CLEANING"],
    serviceKeys: ["regular-home-cleaning", "deep-cleaning"],
    postcodePrefixes: ["SW6", "W14"],
  });

  await saveProviderDocuments({
    providerCompanyId: acceptedProvider.id,
    documents: [
      {
        documentKey: "company_registration_proof",
        label: "Company registration proof",
        fileName: "company.pdf",
        storedFileName: "company.pdf",
        storagePath: "/tmp/company.pdf",
      },
      {
        documentKey: "insurance_proof",
        label: "Insurance proof",
        fileName: "insurance.pdf",
        storedFileName: "insurance.pdf",
        storagePath: "/tmp/insurance.pdf",
      },
      {
        documentKey: "representative_id_document",
        label: "Representative ID document",
        fileName: "id.pdf",
        storedFileName: "id.pdf",
        storagePath: "/tmp/id.pdf",
      },
    ],
  });

  await markProviderAgreementSigned(acceptedProvider.id);
  await submitProviderForReview(acceptedProvider.id);
  await updateProviderReview({ providerCompanyId: acceptedProvider.id, status: "APPROVED", reviewNotes: "Proof approved" });

  const docs = await prisma.providerOnboardingDocument.findMany({ where: { providerCompanyId: acceptedProvider.id } });
  for (const document of docs) {
    await updateProviderDocumentReview({ documentId: document.id, status: "APPROVED", reviewNotes: "Proof approved" });
  }

  await prisma.stripeConnectedAccount.create({
    data: {
      providerCompanyId: acceptedProvider.id,
      stripeAccountId: "acct_proof_invite_to_live",
      mode: "EXPRESS",
      chargeModel: "DIRECT_CHARGES",
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      requirementsJson: {},
    },
  });

  await syncProviderLifecycleState(acceptedProvider.id);
  const beforePricing = await prisma.providerCompany.findUnique({ where: { id: acceptedProvider.id }, include: { stripeConnectedAccount: true, pricingRules: true, serviceCategories: true, coverageAreas: true, agreements: true, documents: true } });
  if (!beforePricing) throw new Error("Provider missing after Stripe setup");

  await saveProviderPricingRule({
    providerCompanyId: acceptedProvider.id,
    categoryKey: "CLEANING",
    serviceKey: "regular-home-cleaning",
    pricingMode: "hourly",
    flatPrice: 0,
    hourlyPrice: 22,
    minimumCharge: 66,
    travelFee: 0,
    sameDayUplift: 12,
    weekendUplift: 8,
    customQuoteRequired: false,
    active: true,
    actorType: "ADMIN",
    actorId: "provider-flow-proof",
  });

  await syncProviderLifecycleState(acceptedProvider.id);
  const finalProvider = await prisma.providerCompany.findUnique({ where: { id: acceptedProvider.id }, include: { stripeConnectedAccount: true, pricingRules: true, serviceCategories: true, coverageAreas: true, agreements: true, documents: true } });
  if (!finalProvider) throw new Error("Final provider missing");

  const latestInvite = await findProviderInviteByEmail(email);
  const finalChecklist = buildProviderChecklist(finalProvider);

  console.log(JSON.stringify({
    invite: {
      created: Boolean(invite.id),
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
      latestInviteMatchesEmail: latestInvite?.email === email,
    },
    lifecycle: {
      afterInviteAccept: acceptedProvider.status,
      beforePricingStatus: beforePricing.status,
      finalStatus: finalProvider.status,
      paymentReady: finalProvider.paymentReady,
    },
    readiness: {
      emailVerified: Boolean(finalProvider.emailVerifiedAt),
      passwordSet: Boolean(finalProvider.passwordSetAt),
      onboardingSubmitted: Boolean(finalProvider.onboardingSubmittedAt),
      approved: Boolean(finalProvider.approvedAt),
      stripeChargesEnabled: Boolean(finalProvider.stripeConnectedAccount?.chargesEnabled),
      stripePayoutsEnabled: Boolean(finalProvider.stripeConnectedAccount?.payoutsEnabled),
      activePricingRules: finalProvider.pricingRules.filter((rule) => rule.active).length,
      checklistComplete: finalChecklist.allComplete,
      missingChecklistItems: finalChecklist.missingLabels,
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
