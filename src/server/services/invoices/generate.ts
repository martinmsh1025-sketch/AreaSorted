import { getPrisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceVariant = "customer" | "provider" | "admin";

export interface GeneratedInvoice {
  id: string;
  number: string;
  variant: InvoiceVariant;
  bookingId: string;
}

// ---------------------------------------------------------------------------
// Sequential invoice number
// ---------------------------------------------------------------------------

/**
 * Generate the next sequential invoice number.
 * Format: INV-YYYYMM-XXXXX  (e.g. INV-202603-00042)
 */
async function nextInvoiceNumber(
  prisma: ReturnType<typeof getPrisma>,
  prefix: string,
): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const pattern = `${prefix}-${ym}-`;

  // Find the highest existing number with this prefix
  const latest = await prisma.invoiceRecord.findFirst({
    where: { number: { startsWith: pattern } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let seq = 1;
  if (latest) {
    const parts = latest.number.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${pattern}${String(seq).padStart(5, "0")}`;
}

// ---------------------------------------------------------------------------
// Booking data loader (shared)
// ---------------------------------------------------------------------------

export type BookingWithInvoiceData = NonNullable<
  Awaited<ReturnType<typeof loadBookingForInvoice>>
>;

export async function loadBookingForInvoice(bookingId: string) {
  const prisma = getPrisma();
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      priceSnapshot: true,
      quoteRequest: { select: { reference: true, serviceKey: true, categoryKey: true } },
      marketplaceProviderCompany: {
        select: {
          id: true,
          tradingName: true,
          legalName: true,
          contactEmail: true,
          registeredAddress: true,
          vatNumber: true,
        },
      },
      invoiceRecords: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Generate invoices for a booking
// ---------------------------------------------------------------------------

/**
 * Create invoice records for the given booking.
 * Generates up to 2 records per booking:
 *   1. Customer receipt (issuer = platform, recipient = customer)
 *   2. Provider remittance advice (issuer = platform, recipient = provider)
 *
 * If invoices already exist for this booking, returns the existing ones
 * without creating duplicates.
 */
export async function generateInvoicesForBooking(
  bookingId: string,
): Promise<GeneratedInvoice[]> {
  const prisma = getPrisma();

  const booking = await loadBookingForInvoice(bookingId);
  if (!booking) throw new Error(`Booking not found: ${bookingId}`);
  if (!booking.priceSnapshot) throw new Error(`No price snapshot for booking: ${bookingId}`);

  // Check for existing invoices
  const existing = await prisma.invoiceRecord.findMany({
    where: { bookingId },
    select: { id: true, number: true, issuer: true, recipient: true },
  });

  const results: GeneratedInvoice[] = [];

  // Derive names
  const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;
  const providerName =
    booking.marketplaceProviderCompany?.tradingName ??
    booking.marketplaceProviderCompany?.legalName ??
    "Provider";
  const platformName = "AreaSorted";

  // ---- Customer receipt ----
  const existingCustomerInvoice = existing.find(
    (inv) => inv.issuer === platformName && inv.recipient === customerName,
  );
  if (existingCustomerInvoice) {
    results.push({
      id: existingCustomerInvoice.id,
      number: existingCustomerInvoice.number,
      variant: "customer",
      bookingId,
    });
  } else {
    const custNum = await nextInvoiceNumber(prisma, "INV");
    const snapshot = booking.priceSnapshot;
    const custInvoice = await prisma.invoiceRecord.create({
      data: {
        bookingId,
        number: custNum,
        strategy: "COMBINED_CUSTOMER_RECEIPT",
        issuer: platformName,
        recipient: customerName,
        totalAmount: snapshot.customerTotalAmount,
        currency: "GBP",
        metadataJson: {
          variant: "customer",
          customerEmail: booking.customer.email,
          providerServiceAmount: Number(snapshot.providerServiceAmount),
          platformBookingFee: Number(snapshot.platformBookingFee),
          optionalExtrasAmount: Number(snapshot.optionalExtrasAmount),
          customerTotalAmount: Number(snapshot.customerTotalAmount),
        } as Prisma.InputJsonValue,
      },
    });
    results.push({
      id: custInvoice.id,
      number: custInvoice.number,
      variant: "customer",
      bookingId,
    });
  }

  // ---- Provider remittance advice ----
  if (booking.marketplaceProviderCompany) {
    const existingProviderInvoice = existing.find(
      (inv) => inv.recipient === providerName && inv.issuer === platformName && inv.id !== results[0]?.id,
    );
    if (existingProviderInvoice) {
      results.push({
        id: existingProviderInvoice.id,
        number: existingProviderInvoice.number,
        variant: "provider",
        bookingId,
      });
    } else {
      const provNum = await nextInvoiceNumber(prisma, "REM");
      const snapshot = booking.priceSnapshot;
      const provInvoice = await prisma.invoiceRecord.create({
        data: {
          bookingId,
          providerCompanyId: booking.marketplaceProviderCompany.id,
          number: provNum,
          strategy: "PROVIDER_SERVICE_PLUS_PLATFORM_FEE_RECEIPT",
          issuer: platformName,
          recipient: providerName,
          totalAmount: snapshot.providerExpectedPayout,
          currency: "GBP",
          metadataJson: {
            variant: "provider",
            providerEmail: booking.marketplaceProviderCompany.contactEmail,
            providerServiceAmount: Number(snapshot.providerServiceAmount),
            platformCommissionAmount: Number(snapshot.platformCommissionAmount),
            platformBookingFee: Number(snapshot.platformBookingFee),
            providerExpectedPayout: Number(snapshot.providerExpectedPayout),
          } as Prisma.InputJsonValue,
        },
      });
      results.push({
        id: provInvoice.id,
        number: provInvoice.number,
        variant: "provider",
        bookingId,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Get or generate invoices (idempotent)
// ---------------------------------------------------------------------------

export async function getOrCreateInvoices(
  bookingId: string,
): Promise<GeneratedInvoice[]> {
  return generateInvoicesForBooking(bookingId);
}
