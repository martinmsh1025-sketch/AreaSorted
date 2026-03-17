"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createProviderInvite } from "@/lib/providers/repository";
import { getProviderCategoryByKey } from "@/lib/providers/service-catalog-mapping";
import { ProviderActivationError, activateProviderCompany, suspendProviderCompany } from "@/server/services/providers/activation";
import { sendTransactionalEmail } from "@/lib/notifications/email";

export async function createProviderInviteAction(formData: FormData) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const approvedCategoryKey = String(formData.get("approvedCategoryKey") || "").trim();
  const approvedCategory = approvedCategoryKey ? getProviderCategoryByKey(approvedCategoryKey) : null;
  if (!email) return;
  if (approvedCategoryKey && !approvedCategory) return;

  const invite = await createProviderInvite({ email, approvedCategoryKey: approvedCategoryKey || null, approvedServiceKeys: [] });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/provider/invite/${invite.token}`;

  let sent = true;
  try {
    const delivery = await sendTransactionalEmail({
      to: email,
      subject: "Your AreaSorted provider invite",
      text: `Open this secure link to start provider setup: ${inviteUrl}`,
    });
    sent = delivery.sent;
  } catch {
    sent = false;
  }

  redirect(`/admin/providers?status=invite_sent&inviteEmail=${encodeURIComponent(email)}&inviteLink=${encodeURIComponent(inviteUrl)}&delivery=${sent ? "email" : "dev_link"}`);
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
