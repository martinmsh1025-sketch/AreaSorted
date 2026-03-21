import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { createDirectChargeCheckoutSession } from "@/lib/stripe/connect";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { createProviderNotification } from "@/lib/providers/notifications";
import { matchProvidersForPublicQuote } from "@/server/services/public/provider-matching";
import { jobTypeCatalog } from "@/lib/service-catalog";

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

  const { providers } = match;

  // Generate pricing previews for all matched providers.
  // Some providers may not have a pricing rule for this specific serviceKey
  // (they were matched by categoryKey + postcode only). We skip those gracefully.
  const previewResults = await Promise.all(
    providers.map(async (provider) => {
      try {
        const preview = await previewProviderPricing({
          providerCompanyId: provider.providerCompanyId,
          categoryKey: input.categoryKey,
          serviceKey: input.serviceKey,
          postcodePrefix: provider.postcodePrefix,
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
        return { provider, preview };
      } catch {
        // Provider doesn't have a pricing rule for this service — skip
        return null;
      }
    }),
  );

  const previews = previewResults.filter(
    (r): r is NonNullable<typeof r> => r !== null,
  );

  // If ALL providers were skipped (no one has pricing for this service), return no_coverage
  if (previews.length === 0) {
    return { status: "no_coverage" as const };
  }

  const prisma = getPrisma();
  const reference = createReference("QR");
  const isSingleProvider = previews.length === 1;

  // For single provider: set providerCompanyId + priceSnapshot directly (backward compatible)
  // For multiple providers: leave providerCompanyId null, customer selects later
  const singleMatch = isSingleProvider ? previews[0] : null;
  const singleQuoteRequired = singleMatch
    ? singleMatch.preview.quoteRequired || !singleMatch.provider.paymentReady
    : false;

  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      reference,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      postcode: input.postcode,
      postcodePrefix: providers[0].postcodePrefix,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      categoryKey: input.categoryKey,
      serviceKey: input.serviceKey,
      providerCompanyId: singleMatch?.provider.providerCompanyId ?? null,
      state: isSingleProvider
        ? (singleQuoteRequired ? "MANUAL_REVIEW_REQUIRED" : "PRICED")
        : "PRICED",
      quoteRequired: singleQuoteRequired,
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
      // Single provider: create legacy priceSnapshot for backward compat
      ...(singleMatch
        ? {
            priceSnapshot: {
              create: {
                providerCompanyId: singleMatch.provider.providerCompanyId,
                pricingRuleId: singleMatch.preview.pricingRuleId,
                providerBasePrice: singleMatch.preview.providerBasePrice,
                bookingFee: singleMatch.preview.bookingFee,
                commissionAmount: singleMatch.preview.commissionAmount,
                postcodeSurcharge: singleMatch.preview.postcodeSurcharge,
                totalCustomerPay: singleMatch.preview.totalCustomerPay,
                expectedProviderPayoutBeforeFees: singleMatch.preview.expectedProviderPayoutBeforeStripeFees,
                quantity: input.quantity,
                estimatedHours: input.estimatedHours ?? 0,
                sameDay: input.sameDay,
                weekend: input.weekend,
                quoteRequired: singleQuoteRequired,
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
          }
        : {}),
      // Always create QuoteOptions for all providers
      quoteOptions: {
        create: previews.map(({ provider, preview }) => ({
          providerCompanyId: provider.providerCompanyId,
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
          quoteRequired: preview.quoteRequired || !provider.paymentReady,
          paymentReady: provider.paymentReady,
          providerName: provider.providerName,
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
        })),
      },
    },
    include: {
      priceSnapshot: true,
      providerCompany: true,
      quoteOptions: {
        include: { providerCompany: true },
        orderBy: { totalCustomerPay: "asc" },
      },
    },
  });

  return {
    status: "quoted" as const,
    quoteRequest,
    multipleProviders: !isSingleProvider,
  };
}

export async function selectQuoteOption(reference: string, quoteOptionId: string) {
  const prisma = getPrisma();

  const quote = await prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      quoteOptions: true,
      priceSnapshot: true,
    },
  });

  if (!quote) {
    throw new Error("Quote request not found");
  }

  const option = quote.quoteOptions.find((o) => o.id === quoteOptionId);
  if (!option) {
    throw new Error("Quote option not found");
  }

  // Create priceSnapshot from the selected option (if not already exists)
  if (quote.priceSnapshot) {
    await prisma.quotePriceSnapshot.delete({ where: { id: quote.priceSnapshot.id } });
  }

  await prisma.quoteRequest.update({
    where: { id: quote.id },
    data: {
      providerCompanyId: option.providerCompanyId,
      selectedQuoteOptionId: option.id,
      state: option.quoteRequired ? "MANUAL_REVIEW_REQUIRED" : "PROVIDER_SELECTED",
      quoteRequired: option.quoteRequired,
      priceSnapshot: {
        create: {
          providerCompanyId: option.providerCompanyId,
          pricingRuleId: option.pricingRuleId,
          providerBasePrice: option.providerBasePrice,
          bookingFee: option.bookingFee,
          commissionAmount: option.commissionAmount,
          postcodeSurcharge: option.postcodeSurcharge,
          totalCustomerPay: option.totalCustomerPay,
          expectedProviderPayoutBeforeFees: option.expectedProviderPayoutBeforeFees,
          quantity: option.quantity,
          estimatedHours: option.estimatedHours,
          sameDay: option.sameDay,
          weekend: option.weekend,
          quoteRequired: option.quoteRequired,
          inputJson: option.inputJson ?? undefined,        },
      },
    },
  });

  return { status: "selected" as const, providerCompanyId: option.providerCompanyId };
}

export async function getPublicQuoteByReference(reference: string) {
  const prisma = getPrisma();
  return prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      providerCompany: true,
      priceSnapshot: true,
      quoteOptions: {
        include: { providerCompany: true },
        orderBy: { totalCustomerPay: "asc" },
      },
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
