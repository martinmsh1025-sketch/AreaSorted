"use server";

import { redirect } from "next/navigation";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import { beginStripeConnectOnboarding, syncProviderStripeStatus } from "@/server/services/providers/onboarding";

export async function startStripeOnboardingAction() {
  const providerCompanyId = await getProviderSessionCompanyId();
  if (!providerCompanyId) redirect("/provider/login");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = await beginStripeConnectOnboarding({
    providerCompanyId,
    refreshUrl: `${appUrl}/provider/dashboard`,
    returnUrl: `${appUrl}/provider/dashboard`,
  });

  redirect(link.url);
}

export async function syncStripeStatusAction() {
  const providerCompanyId = await getProviderSessionCompanyId();
  if (!providerCompanyId) redirect("/provider/login");

  await syncProviderStripeStatus(providerCompanyId);
}
