"use server";

import { redirect } from "next/navigation";
import { buildProviderVerifyEmailUrl, consumeProviderOtp, createProviderOtp } from "@/lib/providers/email-verification";
import { createProviderAuthToken } from "@/lib/providers/auth-tokens";
import { findProviderCompanyByEmail, setProviderEmailVerified } from "@/lib/providers/repository";
import { getProviderDefaultRoute } from "@/lib/providers/portal-routing";

export async function verifyProviderEmailOtpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").trim();
  const purpose = String(formData.get("purpose") || "LOGIN").trim().toUpperCase();

  const consumed = await consumeProviderOtp({ email, code, purpose });
  if (!consumed) {
    redirect(`/provider/verify-email?email=${encodeURIComponent(email)}&purpose=${purpose}&error=invalid_code`);
  }

  const provider = await findProviderCompanyByEmail(email);
  if (!provider) redirect("/provider/login?error=1");

  if (purpose === "LOGIN" && provider.passwordSetAt) {
    redirect(getProviderDefaultRoute(provider.status));
  }

  await setProviderEmailVerified(provider.id);
  const setupToken = await createProviderAuthToken({
    providerCompanyId: provider.id,
    userId: provider.userId,
    email,
    purpose: "PASSWORD_SETUP",
  });

  redirect(`/provider/reset-password/${setupToken.rawToken}?mode=setup`);
}

export async function sendProviderLoginOtpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const purpose = String(formData.get("purpose") || "LOGIN").trim().toUpperCase();
  const provider = await findProviderCompanyByEmail(email);
  if (!provider) redirect("/provider/login?error=1");

  const otp = await createProviderOtp({
    providerCompanyId: provider.id,
    email,
    purpose,
  });

  redirect(
    buildProviderVerifyEmailUrl({
      email,
      code: otp.code,
      deliveryMethod: otp.deliveryMethod,
      deliveryReason: otp.deliveryReason,
    }),
  );
}
