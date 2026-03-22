"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createProviderAuthToken } from "@/lib/providers/auth-tokens";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { findProviderCompanyByEmail } from "@/lib/providers/repository";
import { checkRateLimit, PASSWORD_RESET_RATE_LIMIT } from "@/lib/security/rate-limit";
import { getAppUrl } from "@/lib/config/env";

export async function requestProviderPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/provider/forgot-password?error=1");

  // C-1 FIX: Rate limit password reset requests
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(PASSWORD_RESET_RATE_LIMIT, `${ip}:${email}`);
  if (!rl.allowed) {
    redirect("/provider/forgot-password?sent=1");
  }

  const provider = await findProviderCompanyByEmail(email);
  if (!provider?.userId) {
    redirect("/provider/forgot-password?sent=1");
  }

  const token = await createProviderAuthToken({
    providerCompanyId: provider.id,
    userId: provider.userId,
    email,
    purpose: "PASSWORD_RESET",
  });

  const appUrl = getAppUrl();
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

  // H-16 FIX: Never pass reset link in URL params — log to server console only
  if (!sent && process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Provider password reset link for ${email}: ${resetUrl}`);
  }

  redirect("/provider/forgot-password?sent=1");
}
