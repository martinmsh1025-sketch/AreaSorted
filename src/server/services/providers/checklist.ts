import { getProviderCompanyById } from "@/lib/providers/repository";

export type ProviderChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  detail: string;
};

export type ProviderChecklistResult = {
  items: ProviderChecklistItem[];
  allComplete: boolean;
  missingLabels: string[];
};

type ProviderChecklistSource = {
  legalName: string;
  companyNumber: string;
  registeredAddress: string;
  contactEmail: string;
  phone: string;
  status: string;
  serviceCategories: Array<{ categoryKey: string }>;
  coverageAreas: Array<{ postcodePrefix: string }>;
  agreements: Array<{ status: string }>;
  stripeConnectedAccount: null | {
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  };
};

function isProfileComplete(provider: ProviderChecklistSource | null) {
  if (!provider) return false;
  return Boolean(
    provider.legalName &&
      provider.companyNumber &&
      provider.registeredAddress &&
      provider.contactEmail &&
      provider.phone,
  );
}

export function buildProviderChecklist(provider: ProviderChecklistSource | null): ProviderChecklistResult {
  const stripeReady = Boolean(provider?.stripeConnectedAccount?.chargesEnabled && provider?.stripeConnectedAccount?.payoutsEnabled);
  const agreementSigned = Boolean(provider?.agreements.some((agreement) => agreement.status === "SIGNED"));
  const items: ProviderChecklistItem[] = [
    {
      key: "profile",
      label: "Company profile completed",
      complete: isProfileComplete(provider),
      detail: "Legal name, company number, address, contact email, and phone",
    },
    {
      key: "categories",
      label: "Service categories selected",
      complete: Boolean(provider?.serviceCategories.length),
      detail: "At least one active service category is required",
    },
    {
      key: "coverage",
      label: "Postcode coverage added",
      complete: Boolean(provider?.coverageAreas.length),
      detail: "At least one postcode prefix must be assigned",
    },
    {
      key: "agreement",
      label: "Provider agreement signed",
      complete: agreementSigned,
      detail: "Agreement must be signed before activation",
    },
    {
      key: "stripe",
      label: "Stripe Connect ready",
      complete: stripeReady,
      detail: "charges_enabled and payouts_enabled must both be true",
    },
    {
      key: "suspension",
      label: "Provider not suspended",
      complete: provider?.status !== "SUSPENDED",
      detail: "Suspended providers cannot become active",
    },
  ];

  return {
    items,
    allComplete: items.every((item) => item.complete),
    missingLabels: items.filter((item) => !item.complete).map((item) => item.label),
  };
}

export async function syncProviderActivationState(providerCompanyId: string) {
  const provider = await getProviderCompanyById(providerCompanyId);
  if (!provider) throw new Error("Provider company not found");

  const checklist = buildProviderChecklist(provider);
  if (!checklist.allComplete) {
    return { provider, checklist, nextStatus: provider.status };
  }

  return { provider, checklist, nextStatus: "ACTIVE" as const };
}
