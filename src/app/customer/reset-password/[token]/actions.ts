"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";
import { consumeCustomerAuthToken } from "@/lib/customers/auth-tokens";
import { hashPassword } from "@/lib/security/password";
import { signSessionValue } from "@/lib/security/session";

export async function resetCustomerPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 8) {
    redirect(`/customer/reset-password/${token}?error=password_too_short`);
  }

  if (password !== confirmPassword) {
    redirect(`/customer/reset-password/${token}?error=password_mismatch`);
  }

  const record = await consumeCustomerAuthToken({
    rawToken: token,
    purpose: "PASSWORD_RESET",
  });

  if (!record) {
    redirect("/customer/login?error=invalid_reset_token");
  }

  const prisma = getPrisma();
  const passwordHash = await hashPassword(password);

  await prisma.customer.update({
    where: { id: record.customerId },
    data: { passwordHash },
  });

  // Auto-login after password reset
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, signSessionValue(record.customerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/account");
}
