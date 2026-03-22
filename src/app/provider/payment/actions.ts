"use server";

import { redirect } from "next/navigation";
import { requireProviderStripeAccess } from "@/lib/provider-auth";
import {
  beginStripeConnectOnboarding,
  syncProviderStripeStatus,
} from "@/server/services/providers/onboarding";
import { getAppUrl } from "@/lib/config/env";

export async function startStripeOnboardingAction() {
  const session = await requireProviderStripeAccess();

  const appUrl = getAppUrl();
  try {
    const link = await beginStripeConnectOnboarding({
      providerCompanyId: session.providerCompany.id,
      refreshUrl: `${appUrl}/provider/payment`,
      returnUrl: `${appUrl}/provider/payment`,
    });

    redirect(link.url);
  } catch (error) {
    // M-15 FIX: Don't expose raw Stripe/internal error messages in URL
    if (process.env.NODE_ENV !== "production") {
      console.error("[startStripeOnboarding] Error:", error instanceof Error ? error.message : "Unknown error");
    }
    redirect(`/provider/payment?error=${encodeURIComponent("Unable to start Stripe onboarding. Please try again.")}`);
  }
}

export async function syncStripeStatusAction() {
  const session = await requireProviderStripeAccess();

  try {
    await syncProviderStripeStatus(session.providerCompany.id);
    redirect("/provider/payment?status=synced");
  } catch (error) {
    // M-15 FIX: Don't expose raw Stripe/internal error messages in URL
    if (process.env.NODE_ENV !== "production") {
      console.error("[syncStripeStatus] Error:", error instanceof Error ? error.message : "Unknown error");
    }
    redirect(`/provider/payment?error=${encodeURIComponent("Unable to sync Stripe status. Please try again.")}`);
  }
}
