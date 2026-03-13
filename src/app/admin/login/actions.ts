"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (!process.env.ADMIN_LOGIN_PASSWORD || password !== process.env.ADMIN_LOGIN_PASSWORD) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  redirect("/admin/bookings");
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
