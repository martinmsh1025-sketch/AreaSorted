import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import { signSessionValue } from "@/lib/security/session";
import { getAppUrl } from "@/lib/config/env";

const GOOGLE_STATE_COOKIE = "areasorted_google_oauth_state";

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
};

function getNextPathFromState(state: string) {
  const encoded = state.split(":")[1] || "";
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    return decoded.startsWith("/") ? decoded : "/account";
  } catch {
    return "/account";
  }
}

export async function GET(request: Request) {
  const appUrl = getAppUrl();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const cookieStore = await cookies();
  const savedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value || "";

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/customer/login?error=google_unavailable", appUrl));
  }

  if (!code || !state || !savedState || state !== savedState) {
    cookieStore.delete(GOOGLE_STATE_COOKIE);
    return NextResponse.redirect(new URL("/customer/login?error=google_failed", appUrl));
  }

  try {
    const callbackUrl = `${appUrl}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("token_exchange_failed");
    }

    const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!userRes.ok) {
      throw new Error("userinfo_failed");
    }

    const userInfo = (await userRes.json()) as GoogleUserInfo;
    if (!userInfo.email || !userInfo.sub) {
      throw new Error("missing_google_profile_fields");
    }

    const prisma = getPrisma();
    const existingByGoogle = await prisma.customer.findUnique({ where: { googleSub: userInfo.sub } });
    const existingByEmail = await prisma.customer.findUnique({ where: { email: userInfo.email.toLowerCase() } });

    const firstName = userInfo.given_name || userInfo.name?.split(" ")[0] || "Customer";
    const lastName = userInfo.family_name || userInfo.name?.split(" ").slice(1).join(" ") || "";

    let customerId = existingByGoogle?.id || existingByEmail?.id;
    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          email: userInfo.email.toLowerCase(),
          googleSub: userInfo.sub,
          googleLinkedAt: new Date(),
          firstName: existingByGoogle?.firstName || existingByEmail?.firstName || firstName,
          lastName: existingByGoogle?.lastName || existingByEmail?.lastName || lastName,
        },
      });
    } else {
      const customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email: userInfo.email.toLowerCase(),
          phone: "",
          googleSub: userInfo.sub,
          googleLinkedAt: new Date(),
        },
      });
      customerId = customer.id;
    }

    cookieStore.set(CUSTOMER_SESSION_COOKIE, signSessionValue(customerId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.delete(GOOGLE_STATE_COOKIE);

    return NextResponse.redirect(new URL(getNextPathFromState(state), appUrl));
  } catch {
    cookieStore.delete(GOOGLE_STATE_COOKIE);
    return NextResponse.redirect(new URL("/customer/login?error=google_failed", appUrl));
  }
}
