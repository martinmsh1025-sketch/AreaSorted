"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createInstantBookingFromQuote } from "@/server/services/public/quote-flow";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import { signSessionValue } from "@/lib/security/session";

export async function startInstantBookingAction(formData: FormData) {
  const reference = String(formData.get("reference") || "");
  const result = await createInstantBookingFromQuote(reference);

  // Auto-login: set customer session cookie immediately after booking creation
  if (result.booking.customerId) {
    const cookieStore = await cookies();
    cookieStore.set(CUSTOMER_SESSION_COOKIE, signSessionValue(result.booking.customerId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  redirect(result.sessionUrl || `/booking/status/${result.bookingReference}`);
}
