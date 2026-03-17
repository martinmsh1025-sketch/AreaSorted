"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PROVIDER_SESSION_COOKIE } from "@/lib/provider-auth";
import { getProviderDefaultRoute } from "@/lib/providers/portal-routing";
import { findProviderCompanyByEmail, findProviderInviteByEmail } from "@/lib/providers/repository";
import { verifyPassword } from "@/lib/security/password";

export async function providerLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/provider/login?error=1");

  const provider = await findProviderCompanyByEmail(email);
  if (!provider?.user) {
    const invite = await findProviderInviteByEmail(email);
    if (invite) {
      redirect(`/provider/login?error=invite_not_completed`);
    }

    redirect("/provider/login?error=1");
  }

  const valid = await verifyPassword(password, provider.user.passwordHash);
  if (!valid) redirect("/provider/login?error=1");

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.user.id, {
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
