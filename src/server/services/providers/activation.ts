import { getPrisma } from "@/lib/db";
import { getProviderCompanyById } from "@/lib/providers/repository";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { createProviderNotification } from "@/lib/providers/notifications";

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

  const result = await prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status: "ACTIVE",
      paymentReady: true,
    },
  });

  // Notify provider they are now active
  try {
    await createProviderNotification({
      providerCompanyId,
      type: "SYSTEM_MESSAGE",
      title: "Your account is now active!",
      message: "Congratulations! Your account has been fully activated. You can now receive and accept bookings.",
      link: "/provider",
    });
  } catch {
    // Non-critical
  }

  return result;
}

export async function syncProviderLifecycleState(providerCompanyId: string) {
  const prisma = getPrisma();
  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) throw new Error("Provider company not found");

  const checklist = buildProviderChecklist(provider);
  const stripeReady = Boolean(provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled);
  const hasPricing = Boolean(provider.pricingRules.some((rule) => rule.active));

  let nextStatus = provider.status;

  // Identity locks: these statuses require explicit admin action to change
  // and should NOT be overridden by automated lifecycle transitions.
  if (provider.status === "SUSPENDED") {
    nextStatus = "SUSPENDED";
  } else if (provider.status === "REJECTED") {
    nextStatus = "REJECTED";
  } else if (provider.status === "CHANGES_REQUESTED") {
    nextStatus = "CHANGES_REQUESTED";
  } else if (provider.status === "UNDER_REVIEW" || provider.status === "SUBMITTED_FOR_REVIEW") {
    // These statuses are transitional — admin review can change them.
    // However, automated lifecycle sync should NOT auto-progress them;
    // only keep them if no approval has been granted yet.
    if (!provider.approvedAt) {
      nextStatus = provider.status;
    } else if (checklist.allComplete) {
      nextStatus = "ACTIVE";
    } else if (provider.approvedAt && stripeReady && !hasPricing) {
      nextStatus = "PRICING_PENDING";
    } else if (provider.approvedAt && !stripeReady && provider.stripeConnectedAccount) {
      nextStatus = provider.stripeConnectedAccount.chargesEnabled || provider.stripeConnectedAccount.payoutsEnabled ? "STRIPE_RESTRICTED" : "STRIPE_PENDING";
    } else if (provider.approvedAt) {
      nextStatus = "APPROVED";
    }
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
  const result = await prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status: "SUSPENDED",
      paymentReady: false,
    },
  });

  // Notify provider about suspension
  try {
    await createProviderNotification({
      providerCompanyId,
      type: "SYSTEM_MESSAGE",
      title: "Account suspended",
      message: "Your account has been suspended. Please contact support for more information.",
      link: "/provider",
    });
  } catch {
    // Non-critical
  }

  return result;
}
