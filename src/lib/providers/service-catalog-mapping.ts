import { jobTypeCatalog, serviceCatalog } from "@/lib/service-catalog";

const providerCategoryMap = {
  cleaning: "CLEANING",
  "pest-control": "PEST_CONTROL",
  handyman: "HANDYMAN",
  "furniture-assembly": "FURNITURE_ASSEMBLY",
  "waste-removal": "WASTE_REMOVAL",
  "garden-maintenance": "GARDEN_MAINTENANCE",
} as const;

export const providerServiceCategoryOptions = serviceCatalog.map((service) => ({
  key: providerCategoryMap[service.value],
  label: service.label,
  serviceValue: service.value,
}));

export const providerServiceCatalog = providerServiceCategoryOptions.map((category) => ({
  ...category,
  services: jobTypeCatalog
    .filter((job) => providerCategoryMap[job.service] === category.key)
    .map((job) => ({
      key: job.value,
      label: job.label,
    })),
}));

export function getProviderCategoryByKey(categoryKey: string) {
  return providerServiceCatalog.find((category) => category.key === categoryKey) || null;
}

export const providerStatusLabels: Record<string, string> = {
  INVITED: "Invited",
  EMAIL_VERIFICATION_PENDING: "Email verification pending",
  PASSWORD_SETUP_PENDING: "Password setup pending",
  ONBOARDING_IN_PROGRESS: "Onboarding in progress",
  SUBMITTED_FOR_REVIEW: "Submitted for review",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  STRIPE_PENDING: "Stripe pending",
  STRIPE_RESTRICTED: "Stripe restricted",
  PRICING_PENDING: "Pricing pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

export const providerPortalStatusLabels: Record<string, string> = {
  INVITED: "Invite received",
  EMAIL_VERIFICATION_PENDING: "Verify your email",
  PASSWORD_SETUP_PENDING: "Getting started",
  ONBOARDING_IN_PROGRESS: "Complete onboarding",
  SUBMITTED_FOR_REVIEW: "Application submitted",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Application paused",
  APPROVED: "Approved",
  STRIPE_PENDING: "Set up Stripe",
  STRIPE_RESTRICTED: "Stripe needs attention",
  PRICING_PENDING: "Set up pricing",
  ACTIVE: "Live",
  SUSPENDED: "Temporarily unavailable",
};

export const providerDocumentStatusLabels: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_RESUBMISSION: "Needs resubmission",
};

export const providerStatusToneClass: Record<string, string> = {
  INVITED: "status-badge-legacy",
  EMAIL_VERIFICATION_PENDING: "status-badge-pending",
  PASSWORD_SETUP_PENDING: "status-badge-pending",
  ONBOARDING_IN_PROGRESS: "status-badge-wip",
  SUBMITTED_FOR_REVIEW: "status-badge-pending",
  UNDER_REVIEW: "status-badge-pending",
  CHANGES_REQUESTED: "status-badge-restricted",
  REJECTED: "status-badge-restricted",
  APPROVED: "status-badge-active",
  STRIPE_PENDING: "status-badge-pending",
  STRIPE_RESTRICTED: "status-badge-restricted",
  PRICING_PENDING: "status-badge-wip",
  ACTIVE: "status-badge-active",
  SUSPENDED: "status-badge-legacy",
};

export const providerDocumentToneClass: Record<string, string> = {
  PENDING: "status-badge-pending",
  APPROVED: "status-badge-active",
  REJECTED: "status-badge-restricted",
  NEEDS_RESUBMISSION: "status-badge-wip",
};
