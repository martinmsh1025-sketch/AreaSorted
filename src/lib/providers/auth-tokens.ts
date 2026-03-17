import { createHash, randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createProviderAuthToken(input: {
  providerCompanyId?: string | null;
  userId?: string | null;
  email: string;
  purpose: "PASSWORD_SETUP" | "PASSWORD_RESET";
  expiresInMinutes?: number;
}) {
  const prisma = getPrisma();
  const rawToken = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const token = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000);

  await prisma.providerAuthToken.create({
    data: {
      providerCompanyId: input.providerCompanyId || undefined,
      userId: input.userId || undefined,
      email: input.email.toLowerCase(),
      token,
      purpose: input.purpose,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function consumeProviderAuthToken(input: {
  rawToken: string;
  purpose: "PASSWORD_SETUP" | "PASSWORD_RESET";
}) {
  const prisma = getPrisma();
  const token = hashToken(input.rawToken);
  const record = await prisma.providerAuthToken.findFirst({
    where: {
      token,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      providerCompany: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return null;

  await prisma.providerAuthToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return record;
}

export async function getProviderAuthToken(input: {
  rawToken: string;
  purpose: "PASSWORD_SETUP" | "PASSWORD_RESET";
}) {
  const prisma = getPrisma();
  const token = hashToken(input.rawToken);
  return prisma.providerAuthToken.findFirst({
    where: {
      token,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      providerCompany: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
