import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { createDirectChargeCheckoutSession } from "@/lib/stripe/connect";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { createProviderNotification } from "@/lib/providers/notifications";
import { matchProvidersForPublicQuote } from "@/server/services/public/provider-matching";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { hashPassword } from "@/lib/security/password";

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
  password: string;
  postcode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  categoryKey: string;
  serviceKey: string;
  quantity: number;
  estimatedHours?: number;
  sameDay: boolean;
  weekend: boolean;
  scheduledDate?: string;
  scheduledTimeLabel?: string;
  details?: Record<string, unknown>;
  jobPhotoUrls?: string[];
  /** Cleaning-specific */
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  cleaningCondition?: "light" | "standard" | "heavy" | "very-heavy";
  supplies?: "customer" | "provider";
  propertyType?: string;
  /** Pest control / general size */
  jobSize?: "small" | "standard" | "large";
  /** Add-on keys from catalog */
  addOns?: string[];
  /** Free-text notes */
  notes?: string;
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
  const match = await matchProvidersForPublicQuote({
    postcode: input.postcode,
    categoryKey: input.categoryKey,
  });

  if (match.status !== "matched") {
    return match;
  }

  // Single-provider model: matcher always returns exactly one provider
  const matchedProvider = match.providers[0];

  // Generate pricing preview for the matched provider
  let preview;
  try {
    preview = await previewProviderPricing({
      providerCompanyId: matchedProvider.providerCompanyId,
      categoryKey: input.categoryKey,
      serviceKey: input.serviceKey,
      postcodePrefix: matchedProvider.postcodePrefix,
      estimatedHours: input.estimatedHours,
      quantity: input.quantity,
      sameDay: input.sameDay,
      weekend: input.weekend,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      kitchens: input.kitchens,
      cleaningCondition: input.cleaningCondition,
      supplies: input.supplies,
      propertyType: input.propertyType,
      jobSize: input.jobSize,
      addOns: input.addOns,
    });
  } catch {
    // Provider doesn't have a pricing rule for this service
    return { status: "no_coverage" as const };
  }

  const prisma = getPrisma();
  const reference = createReference("QR");
  const quoteRequired = preview.quoteRequired || !matchedProvider.paymentReady;

  // Create or update customer with password hash at quote time
  const passwordHash = await hashPassword(input.password);
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: input.customerEmail },
    select: { id: true, passwordHash: true },
  });

  if (existingCustomer) {
    // Update name/phone; only set password if they don't already have one
    await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        firstName: input.customerName.split(" ")[0] || input.customerName,
        lastName: input.customerName.split(" ").slice(1).join(" ") || input.customerName,
        phone: input.customerPhone,
        ...(existingCustomer.passwordHash ? {} : { passwordHash }),
      },
    });
  } else {
    await prisma.customer.create({
      data: {
        email: input.customerEmail,
        firstName: input.customerName.split(" ")[0] || input.customerName,
        lastName: input.customerName.split(" ").slice(1).join(" ") || input.customerName,
        phone: input.customerPhone,
        passwordHash,
      },
    });
  }

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      reference,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      postcode: input.postcode,
      postcodePrefix: matchedProvider.postcodePrefix,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      categoryKey: input.categoryKey,
      serviceKey: input.serviceKey,
      providerCompanyId: matchedProvider.providerCompanyId,
      state: quoteRequired ? "MANUAL_REVIEW_REQUIRED" : "PRICED",
      quoteRequired,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      scheduledTimeLabel: input.scheduledTimeLabel,
      jobPhotoUrls: input.jobPhotoUrls ?? [],
      inputJson: toJsonValue({
        ...input.details,
        kitchens: input.kitchens,
        cleaningCondition: input.cleaningCondition,
        supplies: input.supplies,
        addOns: input.addOns,
        notes: input.notes,
      }),
      priceSnapshot: {
        create: {
          providerCompanyId: matchedProvider.providerCompanyId,
          pricingRuleId: preview.pricingRuleId,
          providerBasePrice: preview.providerBasePrice,
          bookingFee: preview.bookingFee,
          commissionAmount: preview.commissionAmount,
          postcodeSurcharge: preview.postcodeSurcharge,
          totalCustomerPay: preview.totalCustomerPay,
          expectedProviderPayoutBeforeFees: preview.expectedProviderPayoutBeforeStripeFees,
          quantity: input.quantity,
          estimatedHours: input.estimatedHours ?? 0,
          sameDay: input.sameDay,
          weekend: input.weekend,
          quoteRequired,
          inputJson: toJsonValue({
            ...input.details,
            quantity: input.quantity,
            estimatedHours: input.estimatedHours,
            sameDay: input.sameDay,
            weekend: input.weekend,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            kitchens: input.kitchens,
            cleaningCondition: input.cleaningCondition,
            supplies: input.supplies,
            propertyType: input.propertyType,
            jobSize: input.jobSize,
            addOns: input.addOns,
            notes: input.notes,
          }),
        },
      },
      // Still create a QuoteOption record for audit/data consistency
      quoteOptions: {
        create: [{
          providerCompanyId: matchedProvider.providerCompanyId,
          pricingRuleId: preview.pricingRuleId,
          providerBasePrice: preview.providerBasePrice,
          bookingFee: preview.bookingFee,
          commissionAmount: preview.commissionAmount,
          postcodeSurcharge: preview.postcodeSurcharge,
          totalCustomerPay: preview.totalCustomerPay,
          expectedProviderPayoutBeforeFees: preview.expectedProviderPayoutBeforeStripeFees,
          quantity: input.quantity,
          estimatedHours: input.estimatedHours ?? 0,
          sameDay: input.sameDay,
          weekend: input.weekend,
          quoteRequired: preview.quoteRequired || !matchedProvider.paymentReady,
          paymentReady: matchedProvider.paymentReady,
          providerName: matchedProvider.providerName,
          inputJson: toJsonValue({
            ...input.details,
            quantity: input.quantity,
            estimatedHours: input.estimatedHours,
            sameDay: input.sameDay,
            weekend: input.weekend,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            kitchens: input.kitchens,
            cleaningCondition: input.cleaningCondition,
            supplies: input.supplies,
            propertyType: input.propertyType,
            jobSize: input.jobSize,
            addOns: input.addOns,
            notes: input.notes,
          }),
        }],
      },
    },
    include: {
      priceSnapshot: true,
      quoteOptions: true,
    },
  });

  return {
    status: "quoted" as const,
    quoteRequest,
  };
}

export async function getPublicQuoteByReference(reference: string) {
  const prisma = getPrisma();
  return prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      providerCompany: {
        select: { id: true, tradingName: true, legalName: true },
      },
      priceSnapshot: true,
      quoteOptions: true,
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
    throw new Error("Quote request not ready for booking — provider must be selected first");
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
      durationHours: Number(quote.priceSnapshot.estimatedHours) || 2,
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
          optionalExtrasAmount: (() => {
            const inputData = toObjectRecord(quote.priceSnapshot.inputJson);
            const addOnKeys = Array.isArray(inputData.addOns) ? inputData.addOns as string[] : [];
            if (addOnKeys.length === 0) return 0;
            const jobType = jobTypeCatalog.find((j) => j.value === quote.serviceKey);
            if (!jobType) return 0;
            return jobType.addOns
              .filter((a) => addOnKeys.includes(a.value))
              .reduce((sum, a) => sum + a.amount, 0);
          })(),
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
      successUrl: `${appUrl}/api/auth/post-payment/${bookingReference}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/quote/${quote.reference}`,
      metadata: {
        bookingId: booking.id,
        bookingReference,
        quoteReference: quote.reference,
      },
    });
    sessionId = session.id;
    sessionUrl = session.url || `${appUrl}/api/auth/post-payment/${bookingReference}`;
  } catch (error) {
    if (!getEnv().ALLOW_MOCK_STRIPE_CHECKOUT) {
      throw error;
    }

    sessionId = `mock_${bookingReference}`;
    sessionUrl = `${appUrl}/api/auth/post-payment/${bookingReference}`;

    // Mock checkout: mark booking as PAID and payment as PAID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { bookingStatus: "PAID" },
    });
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        stripeCheckoutSessionId: sessionId,
        paymentState: "PAID",
      },
    });

    // Generate invoices for this booking
    try {
      const { generateInvoicesForBooking } = await import("@/server/services/invoices/generate");
      await generateInvoicesForBooking(booking.id);
    } catch {
      // Non-critical — invoices can be generated on-demand
    }

    // Notify provider about new paid booking (mock path)
    try {
      if (booking.providerCompanyId) {
        const dateStr = booking.scheduledDate
          ? new Date(booking.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : "TBC";
        await createProviderNotification({
          providerCompanyId: booking.providerCompanyId,
          type: "NEW_ORDER",
          title: "New booking received",
          message: `A new paid booking in ${booking.servicePostcode} for ${dateStr} is waiting for your confirmation.`,
          link: `/provider/orders/${booking.id}`,
          bookingId: booking.id,
        });
      }
    } catch {
      // Non-critical
    }
  }

  // Only update payment + quote if not already done in mock path
  if (sessionId && !sessionId.startsWith("mock_")) {
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        stripeCheckoutSessionId: sessionId,
      },
    });
  }

  await prisma.quoteRequest.update({
    where: { id: quote.id },
    data: {
      bookingId: booking.id,
      state: "BOOKING_CREATED",
    },
  });

  return { booking, sessionUrl, bookingReference };
}
