import { canProviderAccessDashboard, canProviderAccessPricing, canProviderAccessStripe, canProviderEditOnboarding } from "@/lib/providers/status";

export function getProviderDefaultRoute(status: string) {
  if (canProviderAccessDashboard(status)) {
    return "/provider";
  }

  if (canProviderAccessPricing(status)) {
    return "/provider/pricing";
  }

  if (canProviderAccessStripe(status)) {
    return "/provider/payment";
  }

  if (["SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "CHANGES_REQUESTED", "REJECTED"].includes(status)) {
    return "/provider/application-status";
  }

  if (canProviderEditOnboarding(status)) {
    return "/provider/onboarding";
  }

  return "/provider/login";
}
