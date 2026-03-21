import { createHash, randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createCustomerAuthToken(input: {
  customerId: string;
  email: string;
  purpose: string;
  expiresInMinutes?: number;
}) {
  const prisma = getPrisma();
  const rawToken = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const token = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000);

  await prisma.customerAuthToken.create({
    data: {
      customerId: input.customerId,
      email: input.email.toLowerCase(),
      token,
      purpose: input.purpose,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function getCustomerAuthToken(input: {
  rawToken: string;
  purpose: string;
}) {
  const prisma = getPrisma();
  const token = hashToken(input.rawToken);
  return prisma.customerAuthToken.findFirst({
    where: {
      token,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function consumeCustomerAuthToken(input: {
  rawToken: string;
  purpose: string;
}) {
  const prisma = getPrisma();
  const token = hashToken(input.rawToken);
  const record = await prisma.customerAuthToken.findFirst({
    where: {
      token,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return null;

  await prisma.customerAuthToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return record;
}
