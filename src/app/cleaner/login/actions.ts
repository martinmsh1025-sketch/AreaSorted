"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCleanerApplicationByEmail } from "@/lib/cleaner-application-store";
import { getCleanerRecordByEmail } from "@/lib/cleaner-record-store";
import { getCleanerPortalRoute } from "@/lib/cleaner-auth";
import { CLEANER_SESSION_COOKIE } from "@/lib/cleaner-auth";

export async function cleanerLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const cleaner = email ? await getCleanerRecordByEmail(email) : null;
  const application = cleaner ? null : email ? await getCleanerApplicationByEmail(email) : null;
  const storedPassword = cleaner?.password || application?.password || "";

  if (!email || !storedPassword || password !== storedPassword) {
    redirect("/cleaner/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(CLEANER_SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  redirect(await getCleanerPortalRoute(email));
}

export async function cleanerLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(CLEANER_SESSION_COOKIE);
  redirect("/cleaner/login");
}
