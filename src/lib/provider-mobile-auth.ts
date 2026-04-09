import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import {
  canProviderAccessAccount,
  canProviderAccessOrders,
  canProviderAccessPricing,
  canProviderViewOrders,
} from "@/lib/providers/status";

const TOKEN_SEPARATOR = ".";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

type MobileProviderTokenPayload = {
  userId: string;
  exp: number;
};

function getMobileSessionSecret() {
  return process.env.PROVIDER_MOBILE_SESSION_SECRET || process.env.SESSION_SECRET || "";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadPart: string) {
  const secret = getMobileSessionSecret();
  if (!secret || secret === "replace-with-strong-random-secret") {
    throw new Error("Provider mobile session secret is not configured.");
  }

  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

export function createProviderMobileToken(userId: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const payload: MobileProviderTokenPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signaturePart = signPayload(payloadPart);
  return `${payloadPart}${TOKEN_SEPARATOR}${signaturePart}`;
}

export function verifyProviderMobileToken(token: string): MobileProviderTokenPayload | null {
  const separatorIndex = token.lastIndexOf(TOKEN_SEPARATOR);
  if (separatorIndex === -1) return null;

  const payloadPart = token.slice(0, separatorIndex);
  const signaturePart = token.slice(separatorIndex + 1);
  if (!payloadPart || !signaturePart) return null;

  let payload: MobileProviderTokenPayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadPart)) as MobileProviderTokenPayload;
  } catch {
    return null;
  }

  if (!payload?.userId || !payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expected = Buffer.from(signPayload(payloadPart), "utf8");
  const provided = Buffer.from(signaturePart, "utf8");
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  return payload;
}

export type MobileProviderSession = Awaited<ReturnType<typeof getMobileProviderSession>>;

export async function getMobileProviderSession(request: Request | NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const rawToken = authHeader.slice(7).trim();
  const payload = verifyProviderMobileToken(rawToken);
  if (!payload) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      providerCompany: {
        include: {
          stripeConnectedAccount: true,
          serviceCategories: true,
          coverageAreas: true,
          agreements: true,
          documents: true,
          pricingRules: true,
          invites: true,
        },
      },
    },
  });

  if (!user?.isActive || !user.providerCompany) {
    return null;
  }

  return {
    user,
    providerCompany: user.providerCompany,
    rawToken,
  };
}

export async function requireMobileProviderSession(request: Request | NextRequest) {
  const session = await getMobileProviderSession(request);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireMobileProviderAccountSession(request: Request | NextRequest) {
  const session = await requireMobileProviderSession(request);
  if (!canProviderAccessAccount(session.providerCompany.status)) {
    throw new Error("FORBIDDEN_ACCOUNT");
  }
  return session;
}

export async function requireMobileProviderPricingSession(request: Request | NextRequest) {
  const session = await requireMobileProviderSession(request);
  if (!canProviderAccessPricing(session.providerCompany.status)) {
    throw new Error("FORBIDDEN_PRICING");
  }
  return session;
}

export async function requireMobileProviderOrdersSession(request: Request | NextRequest) {
  const session = await requireMobileProviderSession(request);
  if (!canProviderAccessOrders(session.providerCompany.status)) {
    throw new Error("FORBIDDEN_ORDERS");
  }
  return session;
}

export async function requireMobileProviderOrdersListSession(request: Request | NextRequest) {
  const session = await requireMobileProviderSession(request);
  if (!canProviderViewOrders(session.providerCompany.status)) {
    throw new Error("FORBIDDEN_ORDERS_LIST");
  }
  return session;
}
