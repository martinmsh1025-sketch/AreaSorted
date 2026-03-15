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
