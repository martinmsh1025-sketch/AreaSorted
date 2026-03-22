import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicQuote } from "@/server/services/public/quote-flow";
import { normalizeUkPhone } from "@/lib/validation/uk-phone";

const schema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().transform((value, ctx) => {
    const normalized = normalizeUkPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter a valid UK phone number." });
      return z.NEVER;
    }
    return normalized;
  }),
  password: z.string().min(8),
  postcode: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().default(""),
  city: z.string().min(1),
  categoryKey: z.string().min(1),
  serviceKey: z.string().min(1),
  quantity: z.number().min(1).optional().default(1),
  estimatedHours: z.number().min(0.5).optional(),
  sameDay: z.boolean().optional().default(false),
  weekend: z.boolean().optional().default(false),
  scheduledDate: z.string().optional(),
  scheduledTimeLabel: z.string().optional(),
  preferredScheduleOptions: z.array(z.object({
    date: z.string().min(1),
    time: z.string().regex(/^\d{2}:(00|30)$/),
  })).optional().default([]),
  jobPhotoUrls: z.array(z.string().url()).max(5).optional().default([]),
  /** Cleaning-specific */
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  kitchens: z.number().int().min(0).optional(),
  cleaningCondition: z.enum(["light", "standard", "heavy", "very-heavy"]).optional(),
  supplies: z.enum(["customer", "provider"]).optional(),
  propertyType: z.string().optional(),
  /** Pest control / general size selector */
  jobSize: z.enum(["small", "standard", "large"]).optional(),
  /** Add-on keys from the job type catalog */
  addOns: z.array(z.string()).optional(),
  /** Free-text notes / job description */
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const result = await createPublicQuote(payload);

    if (result.status === "no_coverage") {
      return NextResponse.json({ error: "No provider coverage found for that postcode and category." }, { status: 404 });
    }

    if (result.status === "invalid_input") {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({
      redirectUrl: `/quote/${result.quoteRequest.reference}`,
      reference: result.quoteRequest.reference,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Please check your quote details and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create quote" }, { status: 500 });
  }
}
