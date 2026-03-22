"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { PROVIDER_SESSION_COOKIE } from "@/lib/provider-auth";
import { getProviderDefaultRoute } from "@/lib/providers/portal-routing";
import { findProviderCompanyByEmail, findProviderInviteByEmail } from "@/lib/providers/repository";
import { verifyPassword } from "@/lib/security/password";
import { signSessionValue } from "@/lib/security/session";
import { checkRateLimit, LOGIN_RATE_LIMIT, isAccountLocked, recordFailedLogin, clearFailedLogins } from "@/lib/security/rate-limit";

export async function providerLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/provider/login?error=1");

  // C-1 FIX: Rate limit login attempts
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(LOGIN_RATE_LIMIT, `${ip}:${email}`);
  if (!rl.allowed) {
    redirect("/provider/login?error=rate_limited");
  }

  // H-18 FIX: Check account lockout
  if (isAccountLocked(email)) {
    redirect("/provider/login?error=account_locked");
  }

  const provider = await findProviderCompanyByEmail(email);
  if (!provider?.user) {
    const invite = await findProviderInviteByEmail(email);
    if (invite) {
      redirect(`/provider/login?error=invite_not_completed`);
    }

    redirect("/provider/login?error=1");
  }

  const valid = await verifyPassword(password, provider.user.passwordHash);
  if (!valid) {
    recordFailedLogin(email);
    redirect("/provider/login?error=1");
  }

  // Successful login — clear lockout counter
  clearFailedLogins(email);

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, signSessionValue(provider.user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(getProviderDefaultRoute(provider.status));
}

export async function providerLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PROVIDER_SESSION_COOKIE);
  redirect("/provider/login");
}
