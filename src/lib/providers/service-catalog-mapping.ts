export const providerServiceCategoryOptions = [
  { key: "CLEANING", label: "Cleaning" },
  { key: "PEST_CONTROL", label: "Pest control" },
  { key: "HANDYMAN", label: "Handyman" },
  { key: "FURNITURE_ASSEMBLY", label: "Furniture assembly" },
  { key: "WASTE_REMOVAL", label: "Waste removal" },
  { key: "GARDEN_MAINTENANCE", label: "Garden maintenance" },
] as const;

export const providerStatusLabels: Record<string, string> = {
  INVITED: "Invited",
  PROFILE_STARTED: "Profile started",
  AGREEMENT_SIGNED: "Agreement signed",
  STRIPE_PENDING: "Stripe pending",
  STRIPE_RESTRICTED: "Stripe restricted",
  STRIPE_ACTIVE: "Stripe active",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};
