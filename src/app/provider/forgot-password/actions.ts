"use server";

import { redirect } from "next/navigation";
import { createProviderAuthToken } from "@/lib/providers/auth-tokens";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { findProviderCompanyByEmail } from "@/lib/providers/repository";

export async function requestProviderPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/provider/forgot-password?error=1");

  const provider = await findProviderCompanyByEmail(email);
  if (!provider?.userId) {
    redirect("/provider/forgot-password?setupRequired=1");
  }

  const token = await createProviderAuthToken({
    providerCompanyId: provider.id,
    userId: provider.userId,
    email,
    purpose: "PASSWORD_RESET",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/provider/reset-password/${token.rawToken}?mode=reset`;
  const subject = "Reset your AreaSorted provider password";
  const text = `Use this link to reset your provider password: ${resetUrl}`;

  let sent = true;
  try {
    const delivery = await sendTransactionalEmail({ to: email, subject, text });
    sent = delivery.sent;
  } catch {
    sent = false;
  }

  if (!sent && process.env.NODE_ENV !== "production") {
    redirect(`/provider/forgot-password?sent=1&devLink=${encodeURIComponent(resetUrl)}`);
  }

  redirect("/provider/forgot-password?sent=1");
}
