import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { checkRateLimit, CONTACT_RATE_LIMIT } from "@/lib/security/rate-limit";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import type { ComplaintType } from "@prisma/client";

const supportSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  bookingReference: z.string().trim().max(80).optional().default(""),
  postcode: z.string().trim().max(24).optional().default(""),
  topic: z.string().trim().min(1, "Please choose a support topic.").max(80),
  message: z.string().trim().min(1, "Please enter your message.").max(4000),
});

const issueTopicToComplaintType: Record<string, ComplaintType | null> = {
  "Booking confirmation delays": null,
  "Payment holds and charged amounts": null,
  "Reschedule and cancellation help": null,
  "Provider changes or counter offers": "OTHER",
  "Account access and password issues": null,
  "Booking confirmation delay": null,
  "Payment hold or charge question": null,
  "Reschedule or cancellation help": null,
  "Provider issue or no-show": "OTHER",
  "Account access problem": null,
  "Other booking support": "OTHER",
};

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = checkRateLimit(CONTACT_RATE_LIMIT, `support:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
    }

    const payload = supportSchema.parse(await request.json());
    const prisma = getPrisma();

    const enquiry = await prisma.contactEnquiry.create({
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

    const complaintType = issueTopicToComplaintType[payload.topic] ?? null;
    if (payload.bookingReference && complaintType) {
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [{ id: payload.bookingReference }, { quoteRequest: { reference: payload.bookingReference } }],
          customer: { email: payload.email.toLowerCase() },
        },
        select: {
          id: true,
          customerId: true,
          jobs: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, assignedCleanerId: true } },
        },
      });

      if (booking) {
        const existingOpenComplaint = await prisma.complaint.findFirst({
          where: {
            bookingId: booking.id,
            customerId: booking.customerId,
            status: { in: ["OPEN", "UNDER_REVIEW"] },
          },
          select: { id: true },
        });

        if (!existingOpenComplaint) {
          await prisma.complaint.create({
            data: {
              bookingId: booking.id,
              jobId: booking.jobs[0]?.id,
              cleanerId: booking.jobs[0]?.assignedCleanerId ?? null,
              customerId: booking.customerId,
              complaintType,
              description: `[Created from support inbox]\nTopic: ${payload.topic}\n\n${payload.message}`,
              status: "OPEN",
            },
          });
        }
      }
    }

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

    return NextResponse.json({ ok: true, caseReference: enquiry.id.slice(0, 8).toUpperCase() });
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
