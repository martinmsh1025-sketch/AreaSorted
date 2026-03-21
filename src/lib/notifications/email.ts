import nodemailer from "nodemailer";

export type EmailDeliveryResult = {
  sent: boolean;
  reason?: string;
};

/**
 * Send a transactional email.
 *
 * Supports two providers (checked in order):
 *  1. **Resend** — set RESEND_API_KEY env var (recommended for production)
 *  2. **SMTP**  — set SMTP_HOST env var (used for local dev with MailHog etc.)
 *
 * If neither is configured, returns { sent: false } in dev or throws in production.
 */
export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<EmailDeliveryResult> {
  const allowDevFallback = process.env.NODE_ENV !== "production";
  const from = process.env.EMAIL_FROM || "no-reply@areasorted.com";

  /* ── Provider 1: Resend ──────────────────────────────────────────── */
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: input.to,
          subject: input.subject,
          text: input.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        if (allowDevFallback) {
          console.warn("[email] Resend API error:", res.status, body);
          return { sent: false, reason: `resend_api_error_${res.status}` };
        }
        throw new Error(`Resend API error ${res.status}: ${body}`);
      }

      return { sent: true };
    } catch (error) {
      if (allowDevFallback) {
        console.warn("[email] Resend send failed:", error);
        return { sent: false, reason: "resend_send_failed" };
      }
      throw error;
    }
  }

  /* ── Provider 2: SMTP (nodemailer) ───────────────────────────────── */
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    try {
      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
      return { sent: true };
    } catch (error) {
      if (allowDevFallback) {
        console.warn("[email] SMTP send failed:", error);
        return { sent: false, reason: "smtp_unavailable_dev_fallback" };
      }
      throw error;
    }
  }

  /* ── No provider configured ──────────────────────────────────────── */
  if (allowDevFallback) {
    console.warn("[email] No email provider configured (set RESEND_API_KEY or SMTP_HOST)");
    return { sent: false, reason: "no_email_provider_configured" };
  }

  throw new Error(
    "No email provider configured. Set RESEND_API_KEY (recommended) or SMTP_HOST + SMTP_PORT."
  );
}
