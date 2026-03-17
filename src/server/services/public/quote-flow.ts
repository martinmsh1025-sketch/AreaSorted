import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { createDirectChargeCheckoutSession } from "@/lib/stripe/connect";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { matchProviderForPublicQuote } from "@/server/services/public/provider-matching";

function mapCategoryToServiceType(categoryKey: string) {
  switch (categoryKey) {
    case "CLEANING":
      return "REGULAR_CLEANING";
    case "PEST_CONTROL":
      return "PEST_CONTROL";
    case "HANDYMAN":
      return "HANDYMAN";
    case "FURNITURE_ASSEMBLY":
      return "FURNITURE_ASSEMBLY";
    case "WASTE_REMOVAL":
      return "WASTE_REMOVAL";
    case "GARDEN_MAINTENANCE":
      return "GARDEN_MAINTENANCE";
    default:
      return "REGULAR_CLEANING";
  }
}

type CreateQuoteInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  categoryKey: string;
  serviceKey: string;
  quantity: number;
  estimatedHours: number;
  sameDay: boolean;
  weekend: boolean;
  scheduledDate?: string;
  scheduledTimeLabel?: string;
  details?: Record<string, unknown>;
};

function createReference(prefix: string) {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function toJsonValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value));
}

function toObjectRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function createPublicQuote(input: CreateQuoteInput) {
  const match = await matchProviderForPublicQuote({
    postcode: input.postcode,
    categoryKey: input.categoryKey,
  });

  if (match.status !== "matched") {
    return match;
  }

  const preview = await previewProviderPricing({
    providerCompanyId: match.providerCompanyId,
    categoryKey: input.categoryKey,
    serviceKey: input.serviceKey,
    postcodePrefix: match.postcodePrefix,
    estimatedHours: input.estimatedHours,
    quantity: input.quantity,
    sameDay: input.sameDay,
    weekend: input.weekend,
  });

  const prisma = getPrisma();
  const reference = createReference("QR");

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      reference,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      postcode: input.postcode,
      postcodePrefix: match.postcodePrefix,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      categoryKey: input.categoryKey,
      serviceKey: input.serviceKey,
      providerCompanyId: match.providerCompanyId,
      state: preview.quoteRequired || !match.paymentReady ? "MANUAL_REVIEW_REQUIRED" : "PRICED",
      quoteRequired: preview.quoteRequired || !match.paymentReady,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      scheduledTimeLabel: input.scheduledTimeLabel,
      inputJson: toJsonValue(input.details || {}),
      priceSnapshot: {
        create: {
          providerCompanyId: match.providerCompanyId,
          pricingRuleId: preview.pricingRuleId,
          providerBasePrice: preview.providerBasePrice,
          bookingFee: preview.bookingFee,
          commissionAmount: preview.commissionAmount,
          postcodeSurcharge: preview.postcodeSurcharge,
          totalCustomerPay: preview.totalCustomerPay,
          expectedProviderPayoutBeforeFees: preview.expectedProviderPayoutBeforeStripeFees,
          quantity: input.quantity,
          estimatedHours: input.estimatedHours,
          sameDay: input.sameDay,
          weekend: input.weekend,
          quoteRequired: preview.quoteRequired || !match.paymentReady,
          inputJson: toJsonValue({
            ...input.details,
            quantity: input.quantity,
            estimatedHours: input.estimatedHours,
            sameDay: input.sameDay,
            weekend: input.weekend,
          }),
        },
      },
    },
    include: {
      priceSnapshot: true,
      providerCompany: true,
    },
  });

  return {
    status: "quoted" as const,
    quoteRequest,
    provider: match,
    preview,
  };
}

export async function getPublicQuoteByReference(reference: string) {
  const prisma = getPrisma();
  return prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      providerCompany: true,
      priceSnapshot: true,
      booking: {
        include: {
          priceSnapshot: true,
          paymentRecords: true,
        },
      },
    },
  });
}

export async function submitManualQuoteRequest(reference: string) {
  const prisma = getPrisma();
  return prisma.quoteRequest.update({
    where: { reference },
    data: { state: "REQUEST_SUBMITTED" },
  });
}

export async function createInstantBookingFromQuote(reference: string) {
  const prisma = getPrisma();
  const quote = await prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      providerCompany: {
        include: { stripeConnectedAccount: true },
      },
      priceSnapshot: true,
    },
  });

  if (!quote || !quote.providerCompany || !quote.priceSnapshot) {
    throw new Error("Quote request not ready for booking");
  }

  if (quote.quoteRequired) {
    throw new Error("Manual quote required - instant booking not allowed");
  }

  const customer = await prisma.customer.upsert({
    where: { email: quote.customerEmail },
    update: {
      firstName: quote.customerName.split(" ")[0] || quote.customerName,
      lastName: quote.customerName.split(" ").slice(1).join(" ") || quote.customerName,
      phone: quote.customerPhone,
    },
    create: {
      email: quote.customerEmail,
      firstName: quote.customerName.split(" ")[0] || quote.customerName,
      lastName: quote.customerName.split(" ").slice(1).join(" ") || quote.customerName,
      phone: quote.customerPhone,
    },
  });

  const address = await prisma.customerAddress.create({
    data: {
      customerId: customer.id,
      addressLine1: quote.addressLine1,
      addressLine2: quote.addressLine2,
      city: quote.city,
      postcode: quote.postcode,
    },
  });

  const bookingReference = quote.reference;
  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      customerAddressId: address.id,
      providerCompanyId: quote.providerCompanyId,
      serviceAddressLine1: quote.addressLine1,
      serviceAddressLine2: quote.addressLine2,
      serviceCity: quote.city,
      servicePostcode: quote.postcode,
      propertyType: "FLAT",
      serviceType: mapCategoryToServiceType(quote.categoryKey) as any,
      scheduledDate: quote.scheduledDate || new Date(),
      scheduledStartTime: quote.scheduledTimeLabel || "09:00",
      durationHours: quote.priceSnapshot.estimatedHours,
      additionalNotes: JSON.stringify({ ...toObjectRecord(quote.inputJson), bookingReference }),
      bookingStatus: "AWAITING_PAYMENT",
      totalAmount: quote.priceSnapshot.totalCustomerPay,
      cleanerPayoutAmount: quote.priceSnapshot.expectedProviderPayoutBeforeFees,
      platformMarginAmount: Number(quote.priceSnapshot.bookingFee) + Number(quote.priceSnapshot.commissionAmount),
      priceSnapshot: {
        create: {
          providerServiceAmount: quote.priceSnapshot.providerBasePrice,
          platformBookingFee: quote.priceSnapshot.bookingFee,
          platformCommissionAmount: quote.priceSnapshot.commissionAmount,
          platformMarkupAmount: 0,
          optionalExtrasAmount: 0,
          customerTotalAmount: quote.priceSnapshot.totalCustomerPay,
          providerExpectedPayout: quote.priceSnapshot.expectedProviderPayoutBeforeFees,
          pricingJson: toJsonValue(quote.priceSnapshot.inputJson || {}),
        },
      },
    },
    include: {
      priceSnapshot: true,
    },
  });

  const paymentRecord = await prisma.paymentRecord.create({
    data: {
      bookingId: booking.id,
      stripeAccountId: quote.providerCompany.stripeConnectedAccount?.stripeAccountId,
      paymentState: "PENDING",
      grossAmount: quote.priceSnapshot.totalCustomerPay,
      applicationFeeAmount: Number(quote.priceSnapshot.bookingFee) + Number(quote.priceSnapshot.commissionAmount),
      metadataJson: toJsonValue({
        quoteReference: quote.reference,
        bookingReference,
      }),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let sessionId = "";
  let sessionUrl = "";

  try {
    const session = await createDirectChargeCheckoutSession({
      connectedAccountId: quote.providerCompany.stripeConnectedAccount?.stripeAccountId || "",
      lineItems: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            product_data: {
              name: `AreaSorted ${quote.serviceKey}`,
              description: `${quote.postcode} - ${quote.customerName}`,
            },
            unit_amount: Math.round(Number(quote.priceSnapshot.totalCustomerPay) * 100),
          },
        },
      ],
      applicationFeeAmount: Math.round((Number(quote.priceSnapshot.bookingFee) + Number(quote.priceSnapshot.commissionAmount)) * 100),
      successUrl: `${appUrl}/booking/confirmation/${bookingReference}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/quote/${quote.reference}`,
      metadata: {
        bookingId: booking.id,
        bookingReference,
        quoteReference: quote.reference,
      },
    });
    sessionId = session.id;
    sessionUrl = session.url || `${appUrl}/booking/confirmation/${bookingReference}`;
  } catch (error) {
    if (!getEnv().ALLOW_MOCK_STRIPE_CHECKOUT) {
      throw error;
    }

    sessionId = `mock_${bookingReference}`;
    sessionUrl = `${appUrl}/booking/confirmation/${bookingReference}`;
  }

  await prisma.paymentRecord.update({
    where: { id: paymentRecord.id },
    data: {
      stripeCheckoutSessionId: sessionId,
    },
  });

  await prisma.quoteRequest.update({
    where: { id: quote.id },
    data: {
      bookingId: booking.id,
      state: "BOOKING_CREATED",
    },
  });

  return { booking, sessionUrl, bookingReference };
}
