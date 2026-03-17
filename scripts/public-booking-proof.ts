import "dotenv/config";
import { getPrisma } from "@/lib/db";
import { createInstantBookingFromQuote, createPublicQuote, getPublicQuoteByReference, submitManualQuoteRequest } from "@/server/services/public/quote-flow";

async function main() {
  process.env.ALLOW_MOCK_STRIPE_CHECKOUT = "true";
  const prisma = getPrisma();

  await prisma.quotePriceSnapshot.deleteMany({});
  await prisma.quoteRequest.deleteMany({});
  await prisma.paymentRecord.deleteMany({ where: { metadataJson: { path: ["quoteReference"], string_contains: "QR-" } } }).catch(() => null);

  const instantQuote = await createPublicQuote({
    customerName: "Instant Demo",
    customerEmail: "instant-demo@example.com",
    customerPhone: "07111111111",
    postcode: "SW6 2NT",
    addressLine1: "1 Instant Street",
    addressLine2: "",
    city: "London",
    categoryKey: "CLEANING",
    serviceKey: "regular-home-cleaning",
    quantity: 1,
    estimatedHours: 3,
    sameDay: false,
    weekend: false,
    scheduledDate: "2026-03-21",
    scheduledTimeLabel: "10:00",
    details: { flow: "instant" },
  });

  if (instantQuote.status !== "quoted") throw new Error("Expected quoted result for instant path");

  const instantQuoteFromDb = await getPublicQuoteByReference(instantQuote.quoteRequest.reference);
  const instantBooking = await createInstantBookingFromQuote(instantQuote.quoteRequest.reference);
  const instantBookingFromDb = await prisma.booking.findUnique({
    where: { id: instantBooking.booking.id },
    include: {
      priceSnapshot: true,
      paymentRecords: true,
      marketplaceProviderCompany: true,
    },
  });

  const manualQuote = await createPublicQuote({
    customerName: "Manual Demo",
    customerEmail: "manual-demo@example.com",
    customerPhone: "07222222222",
    postcode: "SW6 2NT",
    addressLine1: "2 Manual Street",
    addressLine2: "",
    city: "London",
    categoryKey: "CLEANING",
    serviceKey: "after-builders-cleaning",
    quantity: 1,
    estimatedHours: 4,
    sameDay: false,
    weekend: false,
    scheduledDate: "2026-03-22",
    scheduledTimeLabel: "11:00",
    details: { flow: "manual" },
  });

  if (manualQuote.status !== "quoted") throw new Error("Expected quoted result for manual path");
  await submitManualQuoteRequest(manualQuote.quoteRequest.reference);
  const manualQuoteFromDb = await getPublicQuoteByReference(manualQuote.quoteRequest.reference);

  console.log(JSON.stringify({
    instantPath: {
      quoteReference: instantQuote.quoteRequest.reference,
      displayedQuote: {
        providerBasePrice: Number(instantQuote.preview.providerBasePrice),
        bookingFee: Number(instantQuote.preview.bookingFee),
        commissionAmount: Number(instantQuote.preview.commissionAmount),
        postcodeSurcharge: Number(instantQuote.preview.postcodeSurcharge),
        totalCustomerPay: Number(instantQuote.preview.totalCustomerPay),
        quoteRequired: instantQuote.preview.quoteRequired,
      },
      savedQuoteSnapshot: {
        providerBasePrice: Number(instantQuoteFromDb?.priceSnapshot?.providerBasePrice || 0),
        bookingFee: Number(instantQuoteFromDb?.priceSnapshot?.bookingFee || 0),
        commissionAmount: Number(instantQuoteFromDb?.priceSnapshot?.commissionAmount || 0),
        postcodeSurcharge: Number(instantQuoteFromDb?.priceSnapshot?.postcodeSurcharge || 0),
        totalCustomerPay: Number(instantQuoteFromDb?.priceSnapshot?.totalCustomerPay || 0),
        quoteRequired: instantQuoteFromDb?.priceSnapshot?.quoteRequired || false,
      },
      bookingRecord: {
        bookingId: instantBookingFromDb?.id,
        bookingStatus: instantBookingFromDb?.bookingStatus,
        provider: instantBookingFromDb?.marketplaceProviderCompany?.tradingName || instantBookingFromDb?.marketplaceProviderCompany?.legalName,
      },
      paymentRecord: {
        count: instantBookingFromDb?.paymentRecords.length,
        paymentState: instantBookingFromDb?.paymentRecords[0]?.paymentState,
        grossAmount: Number(instantBookingFromDb?.paymentRecords[0]?.grossAmount || 0),
        applicationFeeAmount: Number(instantBookingFromDb?.paymentRecords[0]?.applicationFeeAmount || 0),
      },
    },
    manualPath: {
      quoteReference: manualQuote.quoteRequest.reference,
      quoteRequired: manualQuote.preview.quoteRequired,
      stateAfterSubmit: manualQuoteFromDb?.state,
      bookingLinked: Boolean(manualQuoteFromDb?.bookingId),
      snapshotTotal: Number(manualQuoteFromDb?.priceSnapshot?.totalCustomerPay || 0),
    },
  }, null, 2));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  const prisma = getPrisma();
  await prisma.$disconnect();
  process.exit(1);
});
