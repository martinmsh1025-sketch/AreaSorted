import { getPrisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import type { Prisma } from "@prisma/client";

export async function sendLoggedEmail(input: {
  to: string;
  subject: string;
  text: string;
  templateCode: string;
  bookingId?: string;
  providerCompanyId?: string;
  payload?: Record<string, unknown>;
}) {
  const prisma = getPrisma();
  const delivery = await sendTransactionalEmail({
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  await prisma.notificationLogV2.create({
    data: {
      bookingId: input.bookingId,
      providerCompanyId: input.providerCompanyId,
      channel: "EMAIL",
      status: delivery.sent ? "SENT" : "FAILED",
      recipient: input.to,
      subject: input.subject,
      templateCode: input.templateCode,
      payloadJson: (input.payload || {}) as Prisma.InputJsonValue,
    },
  });

  return delivery;
}
