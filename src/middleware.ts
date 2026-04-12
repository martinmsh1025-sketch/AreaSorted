import { NextResponse, type NextRequest } from "next/server";

/**
 * H-17 FIX: Edge-level middleware that performs fast cookie-presence checks
 * for protected route groups. This prevents unauthenticated users from
 * even reaching the server-rendered page, reducing server load and
 * providing earlier redirects.
 *
 * NOTE: This is a "soft gate" — the actual session validation (signature
 * verification, DB lookup, isActive check) still happens in the page/action
 * layer via requireAdminSession / requireProviderSession / requireCustomerSession.
 * This middleware only checks if the session cookie EXISTS.
 */

const ADMIN_COOKIE = "areasorted_admin_session";
const PROVIDER_COOKIE = "areasorted_provider_session";
const CUSTOMER_COOKIE = "areasorted_customer_session";

/**
 * CSRF protection: Validate that state-changing requests (POST, PUT, PATCH, DELETE)
 * originate from the same site by checking the Origin header.
 *
 * Exemptions:
 * - Stripe webhook endpoint (uses its own signature verification)
 * - Cron endpoint (uses Bearer token auth)
 * - GET/HEAD/OPTIONS requests (safe methods)
 */
function checkCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null; // Safe methods — no CSRF check needed
  }

  const { pathname } = request.nextUrl;

  // Exempt endpoints that use their own auth mechanisms
  if (pathname.startsWith("/api/stripe/webhook")) return null;
  if (pathname === "/api/cron") return null;
  // Exempt uploadthing callback (uses its own verification)
  if (pathname.startsWith("/api/uploadthing")) return null;

  const origin = request.headers.get("origin");

  // If no Origin header, check Referer as fallback (some older browsers)
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) {
      // No Origin or Referer on a state-changing request — block it
      return NextResponse.json(
        { error: "Forbidden: missing origin" },
        { status: 403 }
      );
    }
    try {
      const refererUrl = new URL(referer);
      const expectedHost = request.nextUrl.host;
      if (refererUrl.host !== expectedHost) {
        return NextResponse.json(
          { error: "Forbidden: cross-origin request" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Forbidden: invalid referer" },
        { status: 403 }
      );
    }
    return null;
  }

  // Validate Origin matches our host
  try {
    const originUrl = new URL(origin);
    const expectedHost = request.nextUrl.host;
    if (originUrl.host !== expectedHost) {
      return NextResponse.json(
        { error: "Forbidden: cross-origin request" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Forbidden: invalid origin" },
      { status: 403 }
    );
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection for all state-changing requests
  const csrfResponse = checkCsrf(request);
  if (csrfResponse) return csrfResponse;

  // Admin routes (except login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.has(ADMIN_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Provider routes (except login, forgot-password, reset-password, invite, verify-email, application-confirmation, application-status)
  if (pathname.startsWith("/provider")) {
    const publicProviderPaths = [
      "/provider/login",
      "/provider/apply",
      "/provider/forgot-password",
      "/provider/reset-password",
      "/provider/invite",
      "/provider/verify-email",
      "/provider/application-confirmation",
      "/provider/application-status",
    ];
    const isPublicProviderPath = publicProviderPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isPublicProviderPath && !request.cookies.has(PROVIDER_COOKIE)) {
      return NextResponse.redirect(new URL("/provider/login", request.url));
    }
  }

  // Customer account routes (except login, register, forgot-password, reset-password)
  if (pathname.startsWith("/account")) {
    if (!request.cookies.has(CUSTOMER_COOKIE)) {
      return NextResponse.redirect(new URL("/customer/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/provider/:path*",
    "/account/:path*",
    "/api/:path*",
  ],
};
