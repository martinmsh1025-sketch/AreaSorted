import { getPrisma } from "@/lib/db";
import { getProviderCompanyById } from "@/lib/providers/repository";
import { buildProviderChecklist } from "@/server/services/providers/checklist";

export class ProviderActivationError extends Error {
  missing: string[];

  constructor(message: string, missing: string[]) {
    super(message);
    this.name = "ProviderActivationError";
    this.missing = missing;
  }
}

export async function activateProviderCompany(providerCompanyId: string) {
  const prisma = getPrisma();
  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) throw new Error("Provider company not found");

  const checklist = buildProviderChecklist(provider);
  if (!checklist.allComplete) {
    throw new ProviderActivationError("Provider cannot be activated until all onboarding requirements are complete.", checklist.missingLabels);
  }

  return prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status: "ACTIVE",
      paymentReady: true,
    },
  });
}

export async function syncProviderLifecycleState(providerCompanyId: string) {
  const prisma = getPrisma();
  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) throw new Error("Provider company not found");

  const checklist = buildProviderChecklist(provider);
  const stripeReady = Boolean(provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled);
  const hasPricing = Boolean(provider.pricingRules.some((rule) => rule.active));

  let nextStatus = provider.status;

  if (provider.status === "SUSPENDED") {
    nextStatus = "SUSPENDED";
  } else if (provider.status === "REJECTED") {
    nextStatus = "REJECTED";
  } else if (provider.status === "CHANGES_REQUESTED") {
    nextStatus = "CHANGES_REQUESTED";
  } else if (provider.status === "UNDER_REVIEW") {
    nextStatus = "UNDER_REVIEW";
  } else if (provider.status === "SUBMITTED_FOR_REVIEW") {
    nextStatus = "SUBMITTED_FOR_REVIEW";
  } else if (checklist.allComplete) {
    nextStatus = "ACTIVE";
  } else if (provider.approvedAt && stripeReady && !hasPricing) {
    nextStatus = "PRICING_PENDING";
  } else if (provider.approvedAt && !stripeReady && provider.stripeConnectedAccount) {
    nextStatus = provider.stripeConnectedAccount.chargesEnabled || provider.stripeConnectedAccount.payoutsEnabled ? "STRIPE_RESTRICTED" : "STRIPE_PENDING";
  } else if (provider.approvedAt) {
    nextStatus = "APPROVED";
  }

  await prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status: nextStatus,
      paymentReady: nextStatus === "ACTIVE",
    },
  });

  return { checklist, nextStatus };
}

export async function getProviderActivationCheck(providerCompanyId: string) {
  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) throw new Error("Provider company not found");

  const checklist = buildProviderChecklist(provider);
  return {
    provider,
    checklist,
    canActivate: checklist.allComplete,
  };
}

export async function suspendProviderCompany(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status: "SUSPENDED",
      paymentReady: false,
    },
  });
}
