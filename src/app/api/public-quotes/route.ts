import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicQuote } from "@/server/services/public/quote-flow";
import { normalizeUkPhone } from "@/lib/validation/uk-phone";
import { checkRateLimit, PUBLIC_QUOTE_RATE_LIMIT } from "@/lib/security/rate-limit";

// M-11 FIX: Only allow UploadThing domains for job photo URLs
const ALLOWED_PHOTO_HOSTS = ["utfs.io", "ufs.sh", "uploadthing.com"];

const schema = z.object({
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email().max(254),
  customerPhone: z.string().max(20).transform((value, ctx) => {
    const normalized = normalizeUkPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter a valid UK phone number." });
      return z.NEVER;
    }
    return normalized;
  }),
  password: z.string().min(8).max(128),
  postcode: z.string().min(1).max(10),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional().default(""),
  city: z.string().min(1).max(100),
  categoryKey: z.string().min(1).max(50),
  serviceKey: z.string().min(1).max(50),
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
  // M-11 FIX: Validate photo URLs are HTTPS and from UploadThing domains only
  jobPhotoUrls: z.array(
    z.string().url().refine((url) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") return false;
        return ALLOWED_PHOTO_HOSTS.some(
          (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
        );
      } catch {
        return false;
      }
    }, "Photo URLs must be HTTPS from our upload service"),
  ).max(5).optional().default([]),
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
  preferredProviderCompanyId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // M-8 FIX: Rate limit public quote creation
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = checkRateLimit(PUBLIC_QUOTE_RATE_LIMIT, ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many quote requests. Please try again later." },
        { status: 429 },
      );
    }

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
    // H-29 FIX: Don't leak internal error messages in production
    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      console.error("[public-quotes] Internal error:", error.message);
    }
    return NextResponse.json({ error: "Unable to create quote" }, { status: 500 });
  }
}
