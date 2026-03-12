import { NextRequest, NextResponse } from "next/server";
import { createAccessToken, upsertBookingRecord } from "@/lib/booking-record-store";
import { getStripe } from "@/lib/stripe";

type CheckoutDraft = {
  bookingReference?: string;
  customerName?: string;
  email?: string;
  contactPhone?: string;
  service?: string;
  postcode?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  kitchens?: string;
  estimatedHours?: number;
  preferredDate?: string;
  preferredTime?: string;
  frequency?: string;
  supplies?: string;
  pets?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingPostcode?: string;
  additionalRequests?: string;
  entryNotes?: string;
  parkingNotes?: string;
  oven?: boolean;
  fridge?: boolean;
  windows?: boolean;
  ironing?: boolean;
  eco?: boolean;
  pricing?: {
    total?: number;
  };
};

function formatServiceLabel(value?: string) {
  return (value || "cleaning-service")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { draft?: CheckoutDraft };
    const draft = body.draft;

    if (!draft?.pricing?.total || draft.pricing.total <= 0) {
      return NextResponse.json({ error: "Missing valid pricing total" }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
      customer_email: draft.email || undefined,
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `WashHub ${formatServiceLabel(draft.service)}`,
              description: [draft.postcode, draft.preferredDate, draft.preferredTime].filter(Boolean).join(" - "),
            },
            unit_amount: Math.round(draft.pricing.total * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingReference: draft.bookingReference || "",
        customerName: draft.customerName || "",
        contactPhone: draft.contactPhone || "",
        service: draft.service || "",
        postcode: draft.postcode || "",
      },
    });

    await upsertBookingRecord({
      bookingReference: draft.bookingReference || `WH-PENDING-${Date.now()}`,
      accessToken: createAccessToken(),
      customerName: draft.customerName || "",
      email: draft.email || "",
      contactPhone: draft.contactPhone || "",
      service: draft.service || "",
      postcode: draft.postcode || "",
      addressLine1: draft.addressLine1 || "",
      addressLine2: draft.addressLine2 || "",
      city: draft.city || "",
      propertyType: draft.propertyType || "",
      bedrooms: draft.bedrooms || "",
      bathrooms: draft.bathrooms || "",
      kitchens: draft.kitchens || "",
      estimatedHours: draft.estimatedHours || 0,
      preferredDate: draft.preferredDate || "",
      preferredTime: draft.preferredTime || "",
      frequency: draft.frequency || "",
      supplies: draft.supplies || "",
      pets: draft.pets || "",
      billingAddressLine1: draft.billingAddressLine1 || "",
      billingAddressLine2: draft.billingAddressLine2 || "",
      billingCity: draft.billingCity || "",
      billingPostcode: draft.billingPostcode || "",
      additionalRequests: draft.additionalRequests || "",
      entryNotes: draft.entryNotes || "",
      parkingNotes: draft.parkingNotes || "",
      addOns: [
        draft.oven ? "Oven" : null,
        draft.fridge ? "Fridge" : null,
        draft.windows ? "Inside windows" : null,
        draft.ironing ? "Ironing" : null,
        draft.eco ? "Eco products" : null,
      ].filter(Boolean) as string[],
      totalAmount: draft.pricing.total,
      stripeSessionId: session.id,
      stripePaymentStatus: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe checkout failed" },
      { status: 500 },
    );
  }
}
