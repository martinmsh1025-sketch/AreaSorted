"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { signSessionValue } from "@/lib/security/session";

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) {
    redirect("/admin/login?error=1");
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
    redirect("/admin/login?error=1");
  }

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
