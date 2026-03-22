import { getPrisma } from "@/lib/db";
import { createConnectedAccountOnboardingLink, createExpressConnectedAccount, fetchConnectedAccountSnapshot } from "@/lib/stripe/connect";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";

function toJsonValue<T>(value: T | null | undefined) {
  return value == null ? undefined : JSON.parse(JSON.stringify(value));
}

export async function createProviderCompanyFromInvite(input: {
  inviteToken: string;
  contactEmail: string;
}) {
  const prisma = getPrisma();
  const invite = await prisma.providerInvite.findUnique({ where: { token: input.inviteToken } });
  if (!invite) throw new Error("Invite not found");
  if (invite.expiresAt <= new Date()) throw new Error("Invite expired");
  if (invite.email.toLowerCase() !== input.contactEmail.toLowerCase()) throw new Error("Invite email does not match");

  if (invite.providerCompanyId) {
    const linkedProvider = await prisma.providerCompany.findUnique({ where: { id: invite.providerCompanyId } });
    if (linkedProvider) {
      return linkedProvider;
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.contactEmail.toLowerCase() },
  });

  if (existingUser) {
    const providerForUser = await prisma.providerCompany.findUnique({
      where: { userId: existingUser.id },
    });

    if (providerForUser) {
      await prisma.providerInvite.update({
        where: { id: invite.id },
        data: {
          providerCompanyId: providerForUser.id,
          acceptedAt: new Date(),
        },
      });

      return providerForUser;
    }
  }

  const existing = await prisma.providerCompany.findFirst({
    where: { contactEmail: input.contactEmail.toLowerCase() },
  });

  if (existing) {
    await prisma.providerInvite.update({
      where: { id: invite.id },
      data: {
        providerCompanyId: existing.id,
        acceptedAt: new Date(),
      },
    });

    return existing;
  }

  const provider = await prisma.providerCompany.create({
    data: {
      contactEmail: input.contactEmail.toLowerCase(),
      status: "EMAIL_VERIFICATION_PENDING",
      serviceCategories: invite.approvedCategoryKey
        ? {
            create: [{ categoryKey: invite.approvedCategoryKey }],
          }
        : undefined,
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
  if (!provider.approvedAt) throw new Error("Admin approval is required before Stripe setup.");

  let stripeAccountId = provider.stripeConnectedAccount?.stripeAccountId;

  if (!stripeAccountId) {
    const account = await createExpressConnectedAccount({
      email: provider.contactEmail,
      businessName: provider.tradingName || provider.legalName || provider.contactEmail,
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

  const refreshed = await prisma.providerCompany.findUnique({
    where: { id: providerCompanyId },
    include: {
      serviceCategories: true,
      coverageAreas: true,
      agreements: true,
      stripeConnectedAccount: true,
      invites: true,
      pricingRules: true,
      documents: true,
    },
  });

  if (refreshed) {
    // C7 FIX: Do NOT write status directly here. Instead, update paymentReady
    // only and delegate status management to syncProviderLifecycleState(),
    // which respects identity locks (SUSPENDED, REJECTED, etc.).
    const paymentReady = snapshot.chargesEnabled && snapshot.payoutsEnabled;
    await prisma.providerCompany.update({
      where: { id: providerCompanyId },
      data: {
        paymentReady,
        // Ensure approvedAt is set if Stripe is fully ready
        ...(paymentReady && !refreshed.approvedAt ? { approvedAt: new Date() } : {}),
      },
    });
  }

  await syncProviderLifecycleState(providerCompanyId);
  return snapshot;
}
