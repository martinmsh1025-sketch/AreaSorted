import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { checkRateLimit, CONTACT_RATE_LIMIT } from "@/lib/security/rate-limit";
import { sendTransactionalEmail } from "@/lib/notifications/email";

const supportSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  bookingReference: z.string().trim().max(80).optional().default(""),
  postcode: z.string().trim().max(24).optional().default(""),
  topic: z.string().trim().min(1, "Please choose a support topic.").max(80),
  message: z.string().trim().min(1, "Please enter your message.").max(4000),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = checkRateLimit(CONTACT_RATE_LIMIT, `support:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
    }

    const payload = supportSchema.parse(await request.json());
    const prisma = getPrisma();

    await prisma.contactEnquiry.create({
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        message: [
          "[Support request]",
          `Topic: ${payload.topic}`,
          payload.bookingReference ? `Booking reference: ${payload.bookingReference}` : null,
          payload.postcode ? `Postcode: ${payload.postcode}` : null,
          "",
          payload.message,
        ].filter(Boolean).join("\n"),
      },
    });

    const supportEmail = process.env.SUPPORT_EMAIL || "support@areasorted.com";
    await sendTransactionalEmail({
      to: supportEmail,
      subject: `[Customer support] ${payload.topic}`,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        payload.bookingReference ? `Booking reference: ${payload.bookingReference}` : null,
        payload.postcode ? `Postcode: ${payload.postcode}` : null,
        `Topic: ${payload.topic}`,
        "",
        payload.message,
      ].filter(Boolean).join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Please check your message and try again." }, { status: 400 });
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("[support] Error:", error instanceof Error ? error.message : "Unknown error");
    }
    return NextResponse.json({ error: "Unable to send support request." }, { status: 500 });
  }
}
