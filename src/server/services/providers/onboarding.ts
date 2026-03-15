import { getPrisma } from "@/lib/db";
import { createConnectedAccountOnboardingLink, createExpressConnectedAccount, fetchConnectedAccountSnapshot } from "@/lib/stripe/connect";
import { buildProviderChecklist } from "@/server/services/providers/checklist";

function toJsonValue<T>(value: T | null | undefined) {
  return value == null ? undefined : JSON.parse(JSON.stringify(value));
}

export async function createProviderCompanyFromInvite(input: {
  inviteToken: string;
  legalName: string;
  tradingName?: string;
  companyNumber: string;
  registeredAddress: string;
  contactEmail: string;
  phone: string;
  vatNumber?: string;
}) {
  const prisma = getPrisma();
  const invite = await prisma.providerInvite.findUnique({ where: { token: input.inviteToken } });
  if (!invite) throw new Error("Invite not found");

  const provider = await prisma.providerCompany.create({
    data: {
      legalName: input.legalName,
      tradingName: input.tradingName,
      companyNumber: input.companyNumber,
      registeredAddress: input.registeredAddress,
      contactEmail: input.contactEmail,
      phone: input.phone,
      vatNumber: input.vatNumber,
      status: "PROFILE_STARTED",
      invites: {
        connect: { id: invite.id },
      },
    },
  });

  await prisma.providerInvite.update({
    where: { id: invite.id },
    data: {
      providerCompanyId: provider.id,
      acceptedAt: new Date(),
    },
  });

  return provider;
}

export async function beginStripeConnectOnboarding(input: {
  providerCompanyId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  const prisma = getPrisma();
  const provider = await prisma.providerCompany.findUnique({ where: { id: input.providerCompanyId }, include: { stripeConnectedAccount: true } });
  if (!provider) throw new Error("Provider company not found");

  let stripeAccountId = provider.stripeConnectedAccount?.stripeAccountId;

  if (!stripeAccountId) {
    const account = await createExpressConnectedAccount({
      email: provider.contactEmail,
      businessName: provider.tradingName || provider.legalName,
    });

    stripeAccountId = account.id;

    await prisma.stripeConnectedAccount.create({
      data: {
        providerCompanyId: provider.id,
        stripeAccountId,
        mode: "EXPRESS",
        chargeModel: "DIRECT_CHARGES",
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirementsJson: toJsonValue(account.requirements),
      },
    });
  }

  const onboardingLink = await createConnectedAccountOnboardingLink({
    accountId: stripeAccountId,
    refreshUrl: input.refreshUrl,
    returnUrl: input.returnUrl,
  });

  await prisma.providerCompany.update({
    where: { id: provider.id },
    data: { status: "STRIPE_PENDING" },
  });

  await prisma.stripeConnectedAccount.update({
    where: { providerCompanyId: provider.id },
    data: { onboardingUrl: onboardingLink.url },
  });

  return onboardingLink;
}

export async function syncProviderStripeStatus(providerCompanyId: string) {
  const prisma = getPrisma();
  const account = await prisma.stripeConnectedAccount.findUnique({ where: { providerCompanyId } });
  if (!account) throw new Error("Connected account not found");

  const snapshot = await fetchConnectedAccountSnapshot(account.stripeAccountId);

  await prisma.stripeConnectedAccount.update({
    where: { providerCompanyId },
    data: {
      chargesEnabled: snapshot.chargesEnabled,
      payoutsEnabled: snapshot.payoutsEnabled,
      detailsSubmitted: snapshot.detailsSubmitted,
      requirementsJson: toJsonValue(snapshot.requirements),
      lastSyncedAt: new Date(),
    },
  });

  await prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      paymentReady: snapshot.chargesEnabled && snapshot.payoutsEnabled,
      status: snapshot.chargesEnabled && snapshot.payoutsEnabled ? "STRIPE_ACTIVE" : "STRIPE_RESTRICTED",
    },
  });

  const refreshed = await prisma.providerCompany.findUnique({
    where: { id: providerCompanyId },
    include: {
      serviceCategories: true,
      coverageAreas: true,
      agreements: true,
      stripeConnectedAccount: true,
      invites: true,
      pricingRules: true,
    },
  });

  if (refreshed) {
    const checklist = buildProviderChecklist(refreshed);
    if (checklist.allComplete && refreshed.status !== "SUSPENDED") {
      await prisma.providerCompany.update({
        where: { id: providerCompanyId },
        data: {
          status: "ACTIVE",
          paymentReady: true,
        },
      });
    }
  }

  return snapshot;
}
