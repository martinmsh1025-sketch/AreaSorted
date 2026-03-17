import { getProviderCompanyById } from "@/lib/providers/repository";
import { getRequiredProviderDocuments } from "@/lib/providers/onboarding-config";

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
  legalName: string | null;
  companyNumber: string | null;
  registeredAddress: string | null;
  contactEmail: string;
  phone: string | null;
  emailVerifiedAt?: Date | null;
  passwordSetAt?: Date | null;
  onboardingSubmittedAt?: Date | null;
  approvedAt?: Date | null;
  status: string;
  serviceCategories: Array<{ categoryKey: string; active?: boolean }>;
  coverageAreas: Array<{ postcodePrefix: string; active?: boolean }>;
  agreements: Array<{ status: string }>;
  documents?: Array<{ documentKey: string; status: string }>;
  pricingRules?: Array<{ active: boolean }>;
  stripeConnectedAccount: null | {
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  };
};

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

function getMissingProfileFields(provider: ProviderChecklistSource | null) {
  if (!provider) return ["company name", "company number", "registered address", "email", "phone"];

  const missing: string[] = [];
  if (!hasValue(provider.legalName)) missing.push("company name");
  if (!hasValue(provider.companyNumber)) missing.push("company number");
  if (!hasValue(provider.registeredAddress)) missing.push("registered address");
  if (!hasValue(provider.contactEmail)) missing.push("email");
  if (!hasValue(provider.phone)) missing.push("phone");
  return missing;
}

function isProfileComplete(provider: ProviderChecklistSource | null) {
  return getMissingProfileFields(provider).length === 0;
}

function hasRequiredDocuments(provider: ProviderChecklistSource | null) {
  if (!provider?.documents?.length) return false;
  const required = getRequiredProviderDocuments();
  return required.every((document) =>
    provider.documents?.some((item) => item.documentKey === document.key && ["PENDING", "APPROVED"].includes(item.status)),
  );
}

function areDocumentsApproved(provider: ProviderChecklistSource | null) {
  if (!provider?.documents?.length) return false;
  const required = getRequiredProviderDocuments();
  return required.every((document) =>
    provider.documents?.some((item) => item.documentKey === document.key && item.status === "APPROVED"),
  );
}

function hasPricing(provider: ProviderChecklistSource | null) {
  return Boolean(provider?.pricingRules?.some((rule) => rule.active));
}

export function buildProviderChecklist(provider: ProviderChecklistSource | null): ProviderChecklistResult {
  const stripeReady = Boolean(provider?.stripeConnectedAccount?.chargesEnabled && provider?.stripeConnectedAccount?.payoutsEnabled);
  const agreementSigned = Boolean(provider?.agreements.some((agreement) => agreement.status === "SIGNED"));

  const items: ProviderChecklistItem[] = [
    {
      key: "email_verified",
      label: "Email verified",
      complete: Boolean(provider?.emailVerifiedAt),
      detail: "Email verification must be completed",
    },
    {
      key: "password_set",
      label: "Password set",
      complete: Boolean(provider?.passwordSetAt),
      detail: "Password setup must be completed",
    },
    {
      key: "profile",
      label: "Company details",
      complete: isProfileComplete(provider),
      detail: getMissingProfileFields(provider).length ? `Missing: ${getMissingProfileFields(provider).join(", ")}` : "Company details complete",
    },
    {
      key: "categories",
      label: "Services",
      complete: Boolean(provider?.serviceCategories.length),
      detail: "Pick at least one service",
    },
    {
      key: "coverage",
      label: "Coverage",
      complete: Boolean(provider?.coverageAreas.length),
      detail: "Add at least one postcode area",
    },
    {
      key: "documents_uploaded",
      label: "Documents",
      complete: hasRequiredDocuments(provider),
      detail: "Upload the required file",
    },
    {
      key: "agreement",
      label: "Agreement",
      complete: agreementSigned,
      detail: "Accept the provider agreement",
    },
    {
      key: "submitted",
      label: "Review submission",
      complete: Boolean(provider?.onboardingSubmittedAt),
      detail: "Submit once everything looks right",
    },
    {
      key: "approved",
      label: "Admin approval",
      complete: Boolean(provider?.approvedAt),
      detail: "Stripe unlocks after approval",
    },
    {
      key: "documents_approved",
      label: "Document approval",
      complete: areDocumentsApproved(provider),
      detail: "Admin needs to approve the required file",
    },
    {
      key: "stripe",
      label: "Stripe",
      complete: stripeReady,
      detail: "Charges and payouts both need to be ready",
    },
    {
      key: "pricing",
      label: "Pricing",
      complete: hasPricing(provider),
      detail: "Add one active pricing rule",
    },
    {
      key: "suspension",
      label: "Status",
      complete: provider?.status !== "SUSPENDED",
      detail: "Suspended providers cannot go live",
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
