import { getRequiredProviderDocuments } from "@/lib/providers/onboarding-config";

export const providerFullDashboardStatuses = new Set(["ACTIVE", "SUSPENDED"]);

export const providerOnboardingEditableStatuses = new Set([
  "ONBOARDING_IN_PROGRESS",
  "CHANGES_REQUESTED",
]);

export const providerReviewVisibleStatuses = new Set([
  "SUBMITTED_FOR_REVIEW",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "REJECTED",
  "APPROVED",
  "STRIPE_PENDING",
  "STRIPE_RESTRICTED",
  "PRICING_PENDING",
  "ACTIVE",
  "SUSPENDED",
]);

export const providerPaymentsVisibleStatuses = new Set([
  "APPROVED",
  "STRIPE_PENDING",
  "STRIPE_RESTRICTED",
  "PRICING_PENDING",
  "ACTIVE",
  "SUSPENDED",
]);

export function canProviderAccessOnboarding(status: string) {
  return status !== "INVITED" && status !== "EMAIL_VERIFICATION_PENDING" && status !== "PASSWORD_SETUP_PENDING";
}

export function canProviderEditOnboarding(status: string) {
  return providerOnboardingEditableStatuses.has(status);
}

export function canProviderAccessStripe(status: string) {
  return ["APPROVED", "STRIPE_PENDING", "STRIPE_RESTRICTED", "PRICING_PENDING", "ACTIVE", "SUSPENDED"].includes(status);
}

export function canProviderAccessPricing(status: string) {
  return ["PRICING_PENDING", "ACTIVE", "SUSPENDED"].includes(status);
}

export function canProviderAccessOrders(status: string) {
  return ["ACTIVE", "SUSPENDED"].includes(status);
}

export function canProviderViewOrders(status: string) {
  return ["PRICING_PENDING", "ACTIVE", "SUSPENDED"].includes(status);
}

export function canProviderAccessAccount(status: string) {
  return status !== "INVITED" && status !== "EMAIL_VERIFICATION_PENDING" && status !== "PASSWORD_SETUP_PENDING";
}

export function canProviderAccessDashboard(status: string) {
  return providerFullDashboardStatuses.has(status);
}

export function getProviderHomePath(status: string) {
  if (status === "INVITED") {
    return "/provider/login";
  }

  return "/provider";
}

export function getProviderApplicationState(input: {
  status: string;
  reviewNotes?: string | null;
  documents?: Array<{ documentKey: string; label: string; status: string }>;
}) {
  const requiredKeys = new Set<string>(getRequiredProviderDocuments().map((item) => item.key));
  const documents = input.documents || [];
  const missingRequired = getRequiredProviderDocuments().find((document) => !documents.some((uploaded) => uploaded.documentKey === document.key && ["PENDING", "APPROVED"].includes(uploaded.status)));
  const flaggedDocument = documents.find((document) => requiredKeys.has(document.documentKey) && ["REJECTED", "NEEDS_RESUBMISSION"].includes(document.status));

  if (input.status === "REJECTED") {
    return {
      label: "Rejected",
      reason: input.reviewNotes || "The application was rejected during review.",
      nextAction: "Contact support or wait for admin guidance.",
    };
  }

  if (input.status === "CHANGES_REQUESTED" || flaggedDocument || missingRequired) {
    return {
      label: "Changes required",
      reason: input.reviewNotes || flaggedDocument?.label || `${missingRequired?.label || "Required document"} is missing.`,
      nextAction: "Upload the required document and continue onboarding.",
    };
  }

  if (input.status === "UNDER_REVIEW") {
    return {
      label: "Under review",
      reason: "The application is being reviewed by the team.",
      nextAction: "Check application status for updates.",
    };
  }

  if (["APPROVED", "STRIPE_PENDING", "STRIPE_RESTRICTED", "PRICING_PENDING", "ACTIVE", "SUSPENDED"].includes(input.status)) {
    return {
      label: "Approved",
      reason: "The application has been approved.",
      nextAction: "Continue with Stripe and pricing setup.",
    };
  }

  return {
    label: "Submitted",
    reason: "The application has been submitted successfully.",
    nextAction: "Wait for review updates.",
  };
}
