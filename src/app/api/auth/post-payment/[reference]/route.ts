import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import { signSessionValue } from "@/lib/security/session";

/**
 * GET /api/auth/post-payment/[reference]
 *
 * Called as the Stripe Checkout success redirect URL.
 * Looks up the booking by reference, sets the customer session cookie,
 * then redirects to the confirmation page.
 *
 * This ensures the customer is always logged in when they land on the
 * confirmation page — even if they completed payment in a different
 * browser tab or their earlier cookie was cleared.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const confirmationUrl = `${appUrl}/booking/confirmation/${reference}`;

  try {
    const prisma = getPrisma();

    // Find the booking via the quote reference
    const quote = await prisma.quoteRequest.findUnique({
      where: { reference },
      select: {
        booking: {
          select: { customerId: true },
        },
      },
    });

    const customerId = quote?.booking?.customerId;
    if (customerId) {
      const cookieStore = await cookies();
      cookieStore.set(CUSTOMER_SESSION_COOKIE, signSessionValue(customerId), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
  } catch {
    // Non-critical — if cookie setting fails, user can still log in manually
  }

  return NextResponse.redirect(confirmationUrl);
}
