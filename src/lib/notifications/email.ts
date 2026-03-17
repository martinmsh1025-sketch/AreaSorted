import nodemailer from "nodemailer";

export type EmailDeliveryResult = {
  sent: boolean;
  reason?: string;
};

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
}) : Promise<EmailDeliveryResult> {
  const allowDevFallback = process.env.NODE_ENV !== "production";

  if (!process.env.SMTP_HOST) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 1025),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@areasorted.com",
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  } catch (error) {
    if (allowDevFallback) {
      return { sent: false, reason: "smtp_unavailable_dev_fallback" };
    }

    throw error;
  }

  return { sent: true };
}
