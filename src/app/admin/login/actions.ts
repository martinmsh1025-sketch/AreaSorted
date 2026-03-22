"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { signSessionValue } from "@/lib/security/session";
import { checkRateLimit, LOGIN_RATE_LIMIT, isAccountLocked, recordFailedLogin, clearFailedLogins } from "@/lib/security/rate-limit";

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) {
    redirect("/admin/login?error=1");
  }

  // C-1 FIX: Rate limit admin login attempts (stricter — admin is high-value target)
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(LOGIN_RATE_LIMIT, `${ip}:${email}`);
  if (!rl.allowed) {
    redirect("/admin/login?error=rate_limited");
  }

  // H-18 FIX: Check account lockout
  if (isAccountLocked(email)) {
    redirect("/admin/login?error=account_locked");
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user || !user.isActive) {
    redirect("/admin/login?error=not_provisioned");
  }

  const hasAdminRole = user.roles.some((assignment) => assignment.role.key === "ADMIN");
  if (!hasAdminRole) {
    redirect("/admin/login?error=not_provisioned");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordFailedLogin(email);
    redirect("/admin/login?error=1");
  }

  // Successful login — clear lockout counter
  clearFailedLogins(email);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, signSessionValue(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin/providers");
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
