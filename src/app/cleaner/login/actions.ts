"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CLEANER_SESSION_COOKIE } from "@/lib/cleaner-auth";

export async function cleanerLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !process.env.CLEANER_LOGIN_PASSWORD || password !== process.env.CLEANER_LOGIN_PASSWORD) {
    redirect("/cleaner/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(CLEANER_SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  redirect("/cleaner/jobs");
}

export async function cleanerLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(CLEANER_SESSION_COOKIE);
  redirect("/cleaner/login");
}
