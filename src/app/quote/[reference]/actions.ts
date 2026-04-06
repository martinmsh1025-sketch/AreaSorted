"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createInstantBookingFromQuote } from "@/server/services/public/quote-flow";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import { signSessionValue } from "@/lib/security/session";
import { getPrisma } from "@/lib/db";
import { getAppUrl } from "@/lib/config/env";

export async function startInstantBookingAction(formData: FormData) {
  const reference = String(formData.get("reference") || "").trim();
  const selectedQuoteOptionId = String(formData.get("selectedQuoteOptionId") || "").trim() || undefined;

  // C-3 FIX: Validate input + verify the quote actually exists before proceeding.
  // This prevents blind probing — an attacker would need to know a valid PRICED quote reference.
  if (!reference || reference.length < 6) {
    throw new Error("Invalid booking request");
  }

  // Verify the quote exists and is in a bookable state before creating session cookies
  const prisma = getPrisma();
  const quote = await prisma.quoteRequest.findUnique({
    where: { reference },
    select: { state: true, customerEmail: true },
  });

  if (!quote || quote.state !== "PRICED") {
    throw new Error("This quote is no longer available for booking");
  }

  // Verify the request originates from our own site (basic CSRF protection)
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const appUrl = getAppUrl();
  if (origin && !appUrl.startsWith(origin) && process.env.NODE_ENV === "production") {
    throw new Error("Invalid request origin");
  }

  const result = await createInstantBookingFromQuote(reference, selectedQuoteOptionId);

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
