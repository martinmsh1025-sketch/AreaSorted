"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createProviderInvite } from "@/lib/providers/repository";
import { activateProviderCompany, ProviderActivationError, suspendProviderCompany } from "@/server/services/providers/activation";

export async function createProviderInviteAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return;

  await createProviderInvite({ email });
}

export async function toggleProviderStatusAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const providerCompanyId = String(formData.get("providerCompanyId") || "");
  const nextStatus = String(formData.get("nextStatus") || "") as "ACTIVE" | "SUSPENDED";
  if (!providerCompanyId || !nextStatus) return;

  try {
    if (nextStatus === "ACTIVE") {
      await activateProviderCompany(providerCompanyId);
      redirect("/admin/providers?status=activated");
    }

    await suspendProviderCompany(providerCompanyId);
    redirect("/admin/providers?status=suspended");
  } catch (error) {
    if (error instanceof ProviderActivationError) {
      redirect(`/admin/providers?error=${encodeURIComponent(error.missing.join(", "))}`);
    }

    redirect("/admin/providers?error=activation_failed");
  }
}
