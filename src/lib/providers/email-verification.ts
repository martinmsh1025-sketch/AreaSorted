import { randomInt } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/notifications/email";

type OtpDeliveryMethod = "EMAIL" | "DEV_FALLBACK";

function createOtpCode() {
  return String(randomInt(100000, 999999));
}

export function buildProviderVerifyEmailUrl(input: {
  email: string;
  code?: string;
  deliveryMethod?: OtpDeliveryMethod;
  deliveryReason?: string | null;
}) {
  const params = new URLSearchParams({ email: input.email.toLowerCase() });

  if (input.deliveryMethod === "DEV_FALLBACK") {
    params.set("delivery", "dev");

    if (process.env.NODE_ENV !== "production" && input.code) {
      params.set("devCode", input.code);
    }

    if (input.deliveryReason) {
      params.set("deliveryReason", input.deliveryReason);
    }
  } else if (input.deliveryMethod === "EMAIL") {
    params.set("delivery", "email");
  }

  return `/provider/verify-email?${params.toString()}`;
}

export async function createProviderOtp(input: { providerCompanyId?: string; email: string; purpose: string }) {
  const prisma = getPrisma();
  const code = createOtpCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.providerEmailVerification.create({
    data: {
      providerCompanyId: input.providerCompanyId,
      email: input.email.toLowerCase(),
      code,
      purpose: input.purpose,
      expiresAt,
    },
  });

  const subject = "Your AreaSorted verification code";
  const text = `Your verification code is ${code}. It expires in 15 minutes.`;

  let deliveryStatus = "SENT";
  let deliveryMethod: OtpDeliveryMethod = "EMAIL";
  let deliveryReason: string | null = null;

  try {
    const delivery = await sendTransactionalEmail({ to: input.email, subject, text });
    if (!delivery.sent) {
      deliveryStatus = "FAILED";
      deliveryMethod = "DEV_FALLBACK";
      deliveryReason = delivery.reason || "dev_fallback";
    }
  } catch (error) {
    deliveryStatus = "FAILED";
    deliveryMethod = "DEV_FALLBACK";
    deliveryReason = error instanceof Error ? error.message : "send_failed";
  }

  await prisma.notificationLogV2.create({
    data: {
      providerCompanyId: input.providerCompanyId,
      channel: "EMAIL",
      status: deliveryStatus as any,
      recipient: input.email.toLowerCase(),
      subject,
      templateCode: `provider_otp_${input.purpose.toLowerCase()}`,
      payloadJson: {
        purpose: input.purpose,
        deliveryMethod,
        deliveryReason,
        devCode: process.env.NODE_ENV !== "production" ? code : undefined,
      },
    },
  });

  return { code, expiresAt, deliveryMethod, deliveryReason };
}

export async function consumeProviderOtp(input: { email: string; code: string; purpose: string }) {
  const prisma = getPrisma();
  const record = await prisma.providerEmailVerification.findFirst({
    where: {
      email: input.email.toLowerCase(),
      code: input.code,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return null;

  return prisma.providerEmailVerification.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
}
