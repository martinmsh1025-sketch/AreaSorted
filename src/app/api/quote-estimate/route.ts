import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchProvidersForPublicQuote } from "@/server/services/public/provider-matching";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { checkRateLimit, QUOTE_ESTIMATE_RATE_LIMIT } from "@/lib/security/rate-limit";

/**
 * Lightweight pricing preview — does provider matching + pricing calculation
 * but writes NOTHING to the database. Used by the quote form wizard to show
 * real-time pricing as the customer fills in details.
 */

const schema = z.object({
  postcode: z.string().min(1),
  categoryKey: z.string().min(1),
  serviceKey: z.string().min(1),
  estimatedHours: z.number().min(0.5).optional(),
  quantity: z.number().int().min(1).optional().default(1),
  sameDay: z.boolean().optional().default(false),
  weekend: z.boolean().optional().default(false),
  weekendCount: z.number().int().min(0).optional().default(0),
  scheduledDate: z.string().optional(),
  scheduledTimeLabel: z.string().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  kitchens: z.number().int().min(0).optional(),
  cleaningCondition: z.enum(["light", "standard", "heavy", "very-heavy"]).optional(),
  supplies: z.enum(["customer", "provider"]).optional(),
  propertyType: z.string().optional(),
  jobSize: z.enum(["small", "standard", "large"]).optional(),
  addOns: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // M-9 FIX: Rate limit quote estimate requests
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = checkRateLimit(QUOTE_ESTIMATE_RATE_LIMIT, ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { status: "error", error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const payload = schema.parse(await request.json());

    // 1. Match provider
    const match = await matchProvidersForPublicQuote({
      postcode: payload.postcode,
      categoryKey: payload.categoryKey,
      serviceKey: payload.serviceKey,
      scheduledDate: payload.scheduledDate ? new Date(payload.scheduledDate) : undefined,
      scheduledTime: payload.scheduledTimeLabel,
    });

    if (match.status !== "matched" || !match.providers.length) {
      return NextResponse.json({ status: "no_coverage" }, { status: 404 });
    }

    let best:
      | {
          provider: (typeof match.providers)[number];
          preview: Awaited<ReturnType<typeof previewProviderPricing>>;
        }
      | null = null;

    for (const provider of match.providers) {
      try {
        const preview = await previewProviderPricing({
          providerCompanyId: provider.providerCompanyId,
          categoryKey: payload.categoryKey,
          serviceKey: payload.serviceKey,
          postcodePrefix: provider.postcodePrefix,
          estimatedHours: payload.estimatedHours,
          quantity: payload.quantity,
          sameDay: payload.sameDay,
          weekend: payload.weekend,
          weekendCount: payload.weekendCount,
          bedrooms: payload.bedrooms,
          bathrooms: payload.bathrooms,
          kitchens: payload.kitchens,
          cleaningCondition: payload.cleaningCondition,
          supplies: payload.supplies,
          propertyType: payload.propertyType,
          jobSize: payload.jobSize,
          addOns: payload.addOns,
        });

        if (!best || preview.totalCustomerPay < best.preview.totalCustomerPay) {
          best = { provider, preview };
        }
      } catch {
        // Skip providers without a usable pricing rule for this request.
      }
    }

    if (!best) {
      return NextResponse.json({ status: "no_pricing" }, { status: 404 });
    }

    // 3. Return customer-facing price breakdown (hide internal fields)
    return NextResponse.json({
      status: "ok",
      servicePrice: best.preview.providerBasePrice,
      bookingFee: best.preview.bookingFee,
      postcodeSurcharge: best.preview.postcodeSurcharge,
      addOnsTotal: best.preview.optionalExtrasAmount,
      totalCustomerPay: best.preview.totalCustomerPay,
    });
  } catch (error) {
    // Provider has no pricing rule for this service
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ status: "no_pricing" }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: "invalid_input", error: error.issues[0]?.message || "Please check your quote details." },
        { status: 400 },
      );
    }
    // H-29 FIX: Don't leak internal error messages in production
    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      console.error("[quote-estimate] Internal error:", error.message);
    }
    return NextResponse.json(
      { status: "error", error: "Unable to estimate price" },
      { status: 500 },
    );
  }
}
