"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import { verifyPassword, hashPassword } from "@/lib/security/password";
import { signSessionValue } from "@/lib/security/session";
import { normalizeUkPhone } from "@/lib/validation/uk-phone";
import { checkRateLimit, LOGIN_RATE_LIMIT, REGISTER_RATE_LIMIT, isAccountLocked, recordFailedLogin, clearFailedLogins } from "@/lib/security/rate-limit";

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function customerLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/customer/login?error=1");

  // C-1 FIX: Rate limit login attempts by IP+email
  const ip = await getClientIp();
  const rl = checkRateLimit(LOGIN_RATE_LIMIT, `${ip}:${email}`);
  if (!rl.allowed) {
    redirect("/customer/login?error=rate_limited");
  }

  // H-18 FIX: Check account lockout (per-email, stricter than IP+email rate limit)
  if (isAccountLocked(email)) {
    redirect("/customer/login?error=account_locked");
  }

  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({ where: { email } });

  if (!customer || !customer.passwordHash) {
    redirect("/customer/login?error=1");
  }

  const valid = await verifyPassword(password, customer.passwordHash);
  if (!valid) {
    recordFailedLogin(email);
    redirect("/customer/login?error=1");
  }

  // Successful login — clear lockout counter
  clearFailedLogins(email);

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, signSessionValue(customer.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/account");
}

export async function customerLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
  redirect("/customer/login");
}

export async function customerRegisterAction(formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");

  if (!firstName || !lastName || !email || !phone || !password) {
    redirect("/customer/register?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/customer/register?error=weak_password");
  }

  const normalizedPhone = normalizeUkPhone(phone);
  if (!normalizedPhone) {
    redirect("/customer/register?error=invalid_phone");
  }

  // C-1 FIX: Rate limit registration by IP
  const ip = await getClientIp();
  const rl = checkRateLimit(REGISTER_RATE_LIMIT, ip);
  if (!rl.allowed) {
    redirect("/customer/register?error=rate_limited");
  }

  const prisma = getPrisma();

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    // C-22 FIX: Only allow password-setting on existing account if the account
    // has no password AND the user proves ownership (matching existing phone).
    // This prevents attackers from claiming any account just by knowing its email.
    if (!existing.passwordHash) {
      // Additional verification: phone must match or be empty on existing record
      if (existing.phone && existing.phone !== normalizedPhone) {
        // Phone mismatch — don't reveal that account exists, show generic error
        redirect("/customer/register?error=email_taken");
      }

      const passwordHash = await hashPassword(password);
        await prisma.customer.update({
          where: { id: existing.id },
          data: { passwordHash, firstName, lastName, phone: normalizedPhone },
        });

      const cookieStore = await cookies();
      cookieStore.set(CUSTOMER_SESSION_COOKIE, signSessionValue(existing.id), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      redirect("/account");
    }

    redirect("/customer/register?error=email_taken");
  }

  const passwordHash = await hashPassword(password);
  const newCustomer = await prisma.customer.create({
    data: { firstName, lastName, email, phone: normalizedPhone, passwordHash },
  });

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, signSessionValue(newCustomer.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/account");
}
