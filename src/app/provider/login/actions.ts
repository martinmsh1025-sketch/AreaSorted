"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PROVIDER_SESSION_COOKIE } from "@/lib/provider-auth";
import { findProviderCompanyByEmail } from "@/lib/providers/repository";

export async function providerLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/provider/login?error=1");

  const provider = await findProviderCompanyByEmail(email);
  if (!provider) redirect("/provider/login?error=1");

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/provider/dashboard");
}
