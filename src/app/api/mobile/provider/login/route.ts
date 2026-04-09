import { NextRequest, NextResponse } from "next/server";
import { findProviderCompanyByEmail, findProviderInviteByEmail } from "@/lib/providers/repository";
import { verifyPassword } from "@/lib/security/password";
import {
  checkRateLimit,
  clearFailedLogins,
  isAccountLocked,
  LOGIN_RATE_LIMIT,
  recordFailedLogin,
} from "@/lib/security/rate-limit";
import { createProviderMobileToken } from "@/lib/provider-mobile-auth";
import { serializeMobileProviderSummary } from "@/lib/providers/mobile-serializers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(LOGIN_RATE_LIMIT, `${ip}:${email}`);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    if (isAccountLocked(email)) {
      return NextResponse.json({ error: "This account is temporarily locked. Please try again later." }, { status: 423 });
    }

    const provider = await findProviderCompanyByEmail(email);
    if (!provider?.user) {
      const invite = await findProviderInviteByEmail(email);
      if (invite) {
        return NextResponse.json({ error: "Your invite exists but setup is not complete yet." }, { status: 403 });
      }
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, provider.user.passwordHash);
    if (!valid) {
      recordFailedLogin(email);
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    clearFailedLogins(email);

    return NextResponse.json({
      token: createProviderMobileToken(provider.user.id),
      provider: serializeMobileProviderSummary(provider),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[mobile-provider-login]", error instanceof Error ? error.message : error);
    }
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
