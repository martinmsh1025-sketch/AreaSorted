import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { getEnv, getAppUrl } from "@/lib/config/env";
import { createDirectChargeCheckoutSession } from "@/lib/stripe/connect";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { createProviderNotification } from "@/lib/providers/notifications";
import { sendLoggedEmail } from "@/lib/notifications/logged-email";
import { parsePreferredScheduleOptions } from "@/lib/quotes/preferred-schedule";
import { matchProvidersForPublicQuote } from "@/server/services/public/provider-matching";
import { jobTypeCatalog } from "@/lib/service-catalog";
import { hashPassword } from "@/lib/security/password";
import type { ServiceType } from "@prisma/client";

function mapCategoryToServiceType(categoryKey: string): ServiceType {
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
  preferredScheduleOptions?: Array<{ date: string; time: string }>;
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
  preferredProviderCompanyId?: string;
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
    serviceKey: input.serviceKey,
  });

  if (match.status !== "matched") {
    return match;
  }

  const pricedProviders: Array<{
    provider: (typeof match.providers)[number];
    preview: Awaited<ReturnType<typeof previewProviderPricing>>;
  }> = [];

  for (const provider of match.providers) {
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

      pricedProviders.push({ provider, preview });
    } catch {
      // Skip providers without a usable pricing rule for this request.
    }
  }

  if (!pricedProviders.length) {
    return { status: "no_coverage" as const };
  }

  pricedProviders.sort((left, right) => {
    if (left.preview.totalCustomerPay !== right.preview.totalCustomerPay) {
      return left.preview.totalCustomerPay - right.preview.totalCustomerPay;
    }
    return left.provider.providerName.localeCompare(right.provider.providerName);
  });

  const preferred = pricedProviders.find((item) => item.provider.providerCompanyId === input.preferredProviderCompanyId);
  const matchedProvider = (preferred || pricedProviders[0]).provider;
  const preview = (preferred || pricedProviders[0]).preview;

  const prisma = getPrisma();
  const reference = createReference("QR");
  const quoteRequired = false;

  // C-12 FIX: Use upsert instead of findUnique+create to prevent race condition
  // when two quote submissions for the same email arrive concurrently.
  const passwordHash = await hashPassword(input.password);
  await prisma.customer.upsert({
    where: { email: input.customerEmail },
    update: {
      firstName: input.customerName.split(" ")[0] || input.customerName,
      lastName: input.customerName.split(" ").slice(1).join(" ") || input.customerName,
      phone: input.customerPhone,
      // Only set password if they don't already have one (preserve existing passwords)
      // Prisma upsert doesn't support conditional fields in update, so we handle this
      // by setting the password in a follow-up conditional update if needed.
    },
    create: {
      email: input.customerEmail,
      firstName: input.customerName.split(" ")[0] || input.customerName,
      lastName: input.customerName.split(" ").slice(1).join(" ") || input.customerName,
      phone: input.customerPhone,
      passwordHash,
    },
  });

  // For existing customers without a password, set it now
  // (upsert update path doesn't conditionally set passwordHash)
  await prisma.customer.updateMany({
    where: {
      email: input.customerEmail,
      passwordHash: null,
    },
    data: { passwordHash },
  });

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
       state: "PRICED",
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
        preferredScheduleOptions: input.preferredScheduleOptions,
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
          quoteRequired: false,
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
            preferredScheduleOptions: input.preferredScheduleOptions,
          }),
        },
      },
      // Still create a QuoteOption record for audit/data consistency
      quoteOptions: {
        create: pricedProviders.map(({ provider, preview }) => ({
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
          quoteRequired: false,
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
            preferredScheduleOptions: input.preferredScheduleOptions,
          }),
        })),
      },
    },
    include: {
      priceSnapshot: true,
      quoteOptions: true,
    },
  });

  const selectedOption = quoteRequest.quoteOptions.find((option) => option.providerCompanyId === matchedProvider.providerCompanyId) || quoteRequest.quoteOptions[0];
  if (selectedOption) {
    await prisma.quoteRequest.update({
      where: { id: quoteRequest.id },
      data: { selectedQuoteOptionId: selectedOption.id },
    });
  }

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
      quoteOptions: {
        orderBy: [{ totalCustomerPay: "asc" }, { providerName: "asc" }],
        include: {
          providerCompany: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              profileImageUrl: true,
              headline: true,
              bio: true,
              yearsExperience: true,
              documents: {
                where: {
                  status: "APPROVED",
                  documentKey: { in: ["dbs_certificate", "insurance_proof"] },
                },
                select: { documentKey: true },
              },
            },
          },
        },
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

export async function createInstantBookingFromQuote(reference: string, selectedQuoteOptionId?: string) {
  const prisma = getPrisma();

  // C1 FIX: Atomically claim the quote to prevent double-booking.
  // Only a quote in "PRICED" state can proceed; the update acts as a lock.
  const claimResult = await prisma.quoteRequest.updateMany({
    where: { reference, state: "PRICED" },
    data: { state: "BOOKING_IN_PROGRESS" },
  });

  if (claimResult.count === 0) {
    // Either the quote doesn't exist or it's already been claimed/booked
    throw new Error("Quote is no longer available for booking — it may already have been booked");
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      providerCompany: {
        include: { stripeConnectedAccount: true },
      },
      priceSnapshot: true,
      quoteOptions: true,
    },
  });

  if (!quote || !quote.priceSnapshot) {
    // Roll back the claim since the data isn't ready
    await prisma.quoteRequest.updateMany({
      where: { reference, state: "BOOKING_IN_PROGRESS" },
      data: { state: "PRICED" },
    });
    throw new Error("Quote request not ready for booking — provider must be selected first");
  }

  const selectedOption = quote.quoteOptions.find((option) => option.id === (selectedQuoteOptionId || quote.selectedQuoteOptionId)) || quote.quoteOptions[0];
  if (!selectedOption) {
    await prisma.quoteRequest.updateMany({
      where: { reference, state: "BOOKING_IN_PROGRESS" },
      data: { state: "PRICED" },
    });
    throw new Error("Quote request not ready for booking — provider must be selected first");
  }

  const selectedProvider = await prisma.providerCompany.findUnique({
    where: { id: selectedOption.providerCompanyId },
    include: { stripeConnectedAccount: true },
  });

  if (!selectedProvider) {
    await prisma.quoteRequest.updateMany({
      where: { reference, state: "BOOKING_IN_PROGRESS" },
      data: { state: "PRICED" },
    });
    throw new Error("Selected provider is no longer available");
  }

  await prisma.quoteRequest.update({
    where: { id: quote.id },
    data: {
      providerCompanyId: selectedProvider.id,
      selectedQuoteOptionId: selectedOption.id,
    },
  });

  // H-37 FIX: Wrap all DB writes (customer upsert, address, booking, payment record)
  // in a single interactive transaction to ensure atomicity. Stripe calls happen
  // outside the transaction since they are external API calls.
  const { booking, paymentRecord, bookingReference } = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
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

    const address = await tx.customerAddress.create({
      data: {
        customerId: customer.id,
        addressLine1: quote.addressLine1,
        addressLine2: quote.addressLine2,
        city: quote.city,
        postcode: quote.postcode,
      },
    });

    const txBookingReference = quote.reference;
    const txBooking = await tx.booking.create({
      data: {
        customerId: customer.id,
        customerAddressId: address.id,
        providerCompanyId: selectedProvider.id,
        serviceAddressLine1: quote.addressLine1,
        serviceAddressLine2: quote.addressLine2,
        serviceCity: quote.city,
        servicePostcode: quote.postcode,
        propertyType: "FLAT",
        serviceType: mapCategoryToServiceType(quote.categoryKey),
        scheduledDate: quote.scheduledDate || new Date(),
        scheduledStartTime: quote.scheduledTimeLabel || "09:00",
        durationHours: Number(quote.priceSnapshot!.estimatedHours) || 2,
        additionalNotes: JSON.stringify({ ...toObjectRecord(quote.inputJson), bookingReference: txBookingReference }),
        bookingStatus: "AWAITING_PAYMENT",
        totalAmount: selectedOption.totalCustomerPay,
        cleanerPayoutAmount: selectedOption.expectedProviderPayoutBeforeFees,
        platformMarginAmount: Number(selectedOption.bookingFee) + Number(selectedOption.commissionAmount),
        priceSnapshot: {
          create: {
            providerServiceAmount: selectedOption.providerBasePrice,
            platformBookingFee: selectedOption.bookingFee,
            platformCommissionAmount: selectedOption.commissionAmount,
            platformMarkupAmount: 0,
            optionalExtrasAmount: (() => {
              const inputData = toObjectRecord(selectedOption.inputJson);
              const addOnKeys = Array.isArray(inputData.addOns) ? inputData.addOns as string[] : [];
              if (addOnKeys.length === 0) return 0;
              const jobType = jobTypeCatalog.find((j) => j.value === quote.serviceKey);
              if (!jobType) return 0;
              return jobType.addOns
                .filter((a) => addOnKeys.includes(a.value))
                .reduce((sum, a) => sum + a.amount, 0);
            })(),
            customerTotalAmount: selectedOption.totalCustomerPay,
            providerExpectedPayout: selectedOption.expectedProviderPayoutBeforeFees,
            pricingJson: toJsonValue(selectedOption.inputJson || {}),
          },
        },
      },
      include: {
        priceSnapshot: true,
      },
    });

    const txPaymentRecord = await tx.paymentRecord.create({
      data: {
        bookingId: txBooking.id,
        stripeAccountId: selectedProvider.stripeConnectedAccount?.stripeAccountId,
        paymentState: "PENDING",
        grossAmount: selectedOption.totalCustomerPay,
        applicationFeeAmount: Number(selectedOption.bookingFee) + Number(selectedOption.commissionAmount),
        metadataJson: toJsonValue({
          quoteReference: quote.reference,
          bookingReference: txBookingReference,
          quoteOptionId: selectedOption.id,
        }),
      },
    });

    return { booking: txBooking, paymentRecord: txPaymentRecord, bookingReference: txBookingReference };
  });

  // --- Stripe call happens OUTSIDE the transaction ---
  const appUrl = getAppUrl();
  let sessionId = "";
  let sessionUrl = "";

  try {
    const session = await createDirectChargeCheckoutSession({
      connectedAccountId: selectedProvider.stripeConnectedAccount?.stripeAccountId || "",
      lineItems: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            product_data: {
              name: `AreaSorted ${quote.serviceKey}`,
              description: `${quote.postcode} - ${quote.customerName}`,
            },
            unit_amount: Math.round(Number(selectedOption.totalCustomerPay) * 100),
          },
        },
      ],
      applicationFeeAmount: Math.round((Number(selectedOption.bookingFee) + Number(selectedOption.commissionAmount)) * 100),
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

    // Mock checkout: treat authorization as completed and wait for provider confirmation
    await prisma.booking.update({
      where: { id: booking.id },
      data: { bookingStatus: "PENDING_ASSIGNMENT" },
    });
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        stripeCheckoutSessionId: sessionId,
        paymentState: "PENDING",
        metadataJson: toJsonValue({
          quoteReference: quote.reference,
          bookingReference,
          authorizationStatus: "AUTHORIZED",
          authorizedAt: new Date().toISOString(),
          mockCheckout: true,
        }),
      },
    });

    try {
      const { sendBookingConfirmationEmail } = await import("@/lib/notifications/booking-emails");
      await sendBookingConfirmationEmail(booking.id);
    } catch {
      // Non-critical: booking is created regardless of email delivery
    }

    // Notify provider about new paid booking (mock path)
    try {
      if (booking.providerCompanyId) {
        const providerRecord = await prisma.providerCompany.findUnique({
          where: { id: booking.providerCompanyId },
          select: { contactEmail: true, tradingName: true, legalName: true },
        });
        const dateStr = booking.scheduledDate
          ? new Date(booking.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : "TBC";
        const scheduleOptions = parsePreferredScheduleOptions(quote.inputJson);
        await createProviderNotification({
          providerCompanyId: booking.providerCompanyId,
          type: "NEW_ORDER",
          title: "Booking awaiting confirmation",
          message: `A new authorised booking in ${booking.servicePostcode} for ${dateStr}${scheduleOptions.length > 1 ? ` (${scheduleOptions.length} date options)` : ""} is waiting for your confirmation.`,
          link: `/provider/orders/${booking.id}`,
          bookingId: booking.id,
        });
        if (providerRecord?.contactEmail) {
          await sendLoggedEmail({
            to: providerRecord.contactEmail,
            subject: `New booking request awaiting confirmation — ${bookingReference}`,
            text: [
              `A new booking request is waiting for your confirmation.`,
              "",
              `Reference: ${bookingReference}`,
              `Date: ${dateStr}`,
              `Postcode: ${booking.servicePostcode}`,
              scheduleOptions.length > 1 ? `Other schedule options: ${scheduleOptions.length - 1}` : "",
              "",
              `Open the order: ${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/provider/orders/${booking.id}`,
            ].filter(Boolean).join("\n"),
            templateCode: "provider_new_job_request",
            bookingId: booking.id,
            providerCompanyId: booking.providerCompanyId,
            payload: { bookingReference },
          });
        }
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

// Re-export the "BOOKING_IN_PROGRESS" state for schema/type reference
export const QUOTE_BOOKING_IN_PROGRESS_STATE = "BOOKING_IN_PROGRESS" as const;
