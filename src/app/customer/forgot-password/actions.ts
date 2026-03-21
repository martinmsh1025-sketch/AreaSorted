"use server";

import { redirect } from "next/navigation";
import { createCustomerAuthToken } from "@/lib/customers/auth-tokens";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { getPrisma } from "@/lib/db";

export async function requestCustomerPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/customer/forgot-password?error=1");

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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

  if (!sent && process.env.NODE_ENV !== "production") {
    redirect(`/customer/forgot-password?sent=1&devLink=${encodeURIComponent(resetUrl)}`);
  }

  redirect("/customer/forgot-password?sent=1");
}
