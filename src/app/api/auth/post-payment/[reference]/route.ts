import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import { signSessionValue } from "@/lib/security/session";
import { getAppUrl } from "@/lib/config/env";

/**
 * GET /api/auth/post-payment/[reference]
 *
 * Called as the Stripe Checkout success redirect URL.
 * Looks up the booking by reference, validates the Stripe session_id
 * against what we stored, sets the customer session cookie,
 * then redirects to the confirmation page.
 *
 * H3 FIX: Requires a valid session_id query parameter that matches the
 * stored Stripe checkout session ID. This prevents IDOR — guessing the
 * reference alone is not enough to get a session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const appUrl = getAppUrl();
  const confirmationUrl = `${appUrl}/booking/confirmation/${reference}`;

  try {
    const prisma = getPrisma();
    const sessionId = request.nextUrl.searchParams.get("session_id");

    // Find the booking via the quote reference
    const quote = await prisma.quoteRequest.findUnique({
      where: { reference },
      select: {
        booking: {
          select: {
            customerId: true,
            paymentRecords: {
              orderBy: { createdAt: "desc" as const },
              take: 1,
              select: { stripeCheckoutSessionId: true },
            },
          },
        },
      },
    });

    const customerId = quote?.booking?.customerId;
    const storedSessionId = quote?.booking?.paymentRecords[0]?.stripeCheckoutSessionId;

    // H3 FIX: Only grant a session if:
    // 1. We have a valid customer ID
    // 2. The session_id from the URL matches what we stored (or it's a mock session)
    // This prevents an attacker from guessing a reference and getting a session cookie.
    // H-21 FIX: Only allow mock sessions in non-production environments
    const isProduction = process.env.NODE_ENV === "production";
    const isMockSession = !isProduction && storedSessionId?.startsWith("mock_");
    const sessionValid = sessionId && storedSessionId && (sessionId === storedSessionId || isMockSession);

    if (customerId && sessionValid) {
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
