import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { checkRateLimit, CONTACT_RATE_LIMIT } from "@/lib/security/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  message: z.string().trim().min(1, "Please enter your message.").max(4000),
});

export async function POST(request: NextRequest) {
  try {
    // M-7 FIX: Rate limit contact form submissions
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = checkRateLimit(CONTACT_RATE_LIMIT, ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 },
      );
    }

    const { name, email, message } = contactSchema.parse(await request.json());

    const prisma = getPrisma();

    // Store the enquiry in the database
    await prisma.contactEnquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Please check your message and try again." }, { status: 400 });
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("[contact] Error:", error instanceof Error ? error.message : "Unknown error");
    }
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
