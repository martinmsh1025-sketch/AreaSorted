import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/config/env";
import { getSafeRedirectPath } from "@/lib/security/redirect";

const GOOGLE_STATE_COOKIE = "areasorted_google_oauth_state";

export async function GET(request: Request) {
  const appUrl = getAppUrl();

  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(new URL("/customer/login?error=google_unavailable", appUrl));
    }

    const url = new URL(request.url);
    // Validate redirect target to prevent open-redirect via state parameter
    const next = getSafeRedirectPath(url.searchParams.get("next"), "/account");
    const state = `${crypto.randomUUID()}:${Buffer.from(next).toString("base64url")}`;
    const callbackUrl = `${appUrl}/api/auth/google/callback`;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl);
    const cookieStore = await cookies();
    cookieStore.set(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/customer/login?error=google_failed", appUrl));
  }
}
