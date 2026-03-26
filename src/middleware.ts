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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  ],
};
