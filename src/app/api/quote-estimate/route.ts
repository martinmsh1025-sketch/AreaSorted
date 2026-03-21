import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchProvidersForPublicQuote } from "@/server/services/public/provider-matching";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";

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

    const provider = match.providers[0];

    // 2. Calculate real price using provider's pricing rules
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

    // 3. Return customer-facing price breakdown (hide internal fields)
    return NextResponse.json({
      status: "ok",
      servicePrice: preview.providerBasePrice,
      bookingFee: preview.bookingFee,
      postcodeSurcharge: preview.postcodeSurcharge,
      addOnsTotal: preview.optionalExtrasAmount,
      totalCustomerPay: preview.totalCustomerPay,
    });
  } catch (error) {
    // Provider has no pricing rule for this service
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ status: "no_pricing" }, { status: 404 });
    }
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Unable to estimate price" },
      { status: 500 },
    );
  }
}
