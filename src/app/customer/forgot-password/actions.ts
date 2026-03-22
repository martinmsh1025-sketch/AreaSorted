"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createCustomerAuthToken } from "@/lib/customers/auth-tokens";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { getPrisma } from "@/lib/db";
import { checkRateLimit, PASSWORD_RESET_RATE_LIMIT } from "@/lib/security/rate-limit";
import { getAppUrl } from "@/lib/config/env";

export async function requestCustomerPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/customer/forgot-password?error=1");

  // C-1 FIX: Rate limit password reset requests
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(PASSWORD_RESET_RATE_LIMIT, `${ip}:${email}`);
  if (!rl.allowed) {
    // Still show success to prevent enumeration
    redirect("/customer/forgot-password?sent=1");
  }

  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({ where: { email } });

  // Always show success message to prevent email enumeration
  if (!customer) {
    redirect("/customer/forgot-password?sent=1");
  }

  const token = await createCustomerAuthToken({
    customerId: customer.id,
    email,
    purpose: "PASSWORD_RESET",
  });

  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/customer/reset-password/${token.rawToken}`;
  const subject = "Reset your AreaSorted password";
  const text = `Hi ${customer.firstName},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.\n\nAreaSorted`;

  let sent = true;
  try {
    const delivery = await sendTransactionalEmail({ to: email, subject, text });
    sent = delivery.sent;
  } catch {
    sent = false;
  }

  // H-16 FIX: Never pass reset link in URL params — log to server console only
  if (!sent && process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Customer password reset link for ${email}: ${resetUrl}`);
  }

  redirect("/customer/forgot-password?sent=1");
}
