"use server";

import { redirect } from "next/navigation";
import { requireProviderStripeAccess } from "@/lib/provider-auth";
import { beginStripeConnectOnboarding, syncProviderStripeStatus } from "@/server/services/providers/onboarding";

export async function startStripeOnboardingAction() {
  const session = await requireProviderStripeAccess();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const link = await beginStripeConnectOnboarding({
      providerCompanyId: session.providerCompany.id,
      refreshUrl: `${appUrl}/provider/dashboard`,
      returnUrl: `${appUrl}/provider/dashboard`,
    });

    redirect(link.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Stripe onboarding";
    redirect(`/provider/dashboard?error=${encodeURIComponent(message)}`);
  }
}

export async function syncStripeStatusAction() {
  const session = await requireProviderStripeAccess();

  try {
    await syncProviderStripeStatus(session.providerCompany.id);
    redirect("/provider/dashboard?status=synced");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync Stripe status";
    redirect(`/provider/dashboard?error=${encodeURIComponent(message)}`);
  }
}
