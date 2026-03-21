import type { InvoiceData } from "@/components/invoice/invoice-templates";
import type { BookingWithInvoiceData } from "@/server/services/invoices/generate";

/**
 * Build an InvoiceData object from a loaded booking.
 * Shared by all three invoice pages (customer, provider, admin).
 */
export function buildInvoiceData(
  booking: BookingWithInvoiceData,
  invoiceNumber: string,
): InvoiceData {
  const snapshot = booking.priceSnapshot;
  const ref = booking.quoteRequest?.reference ?? booking.id.slice(0, 12).toUpperCase();
  const serviceLabel =
    booking.quoteRequest?.serviceKey?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ??
    booking.serviceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const serviceAddress = [
    booking.serviceAddressLine1,
    booking.serviceAddressLine2,
    booking.serviceCity,
    booking.servicePostcode,
  ]
    .filter(Boolean)
    .join(", ");

  const provider = booking.marketplaceProviderCompany;

  return {
    invoiceNumber,
    invoiceDate: booking.createdAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    bookingRef: ref,
    serviceDate: booking.scheduledDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    serviceTime: booking.scheduledStartTime,
    serviceType: serviceLabel,
    serviceAddress,
    durationHours: Number(booking.durationHours),

    customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
    customerEmail: booking.customer.email,

    providerName: provider?.tradingName ?? provider?.legalName ?? "Pending assignment",
    providerEmail: provider?.contactEmail,
    providerAddress: provider?.registeredAddress ?? undefined,
    providerVat: provider?.vatNumber ?? undefined,

    providerServiceAmount: snapshot ? Number(snapshot.providerServiceAmount) : 0,
    platformBookingFee: snapshot ? Number(snapshot.platformBookingFee) : 0,
    platformCommissionAmount: snapshot ? Number(snapshot.platformCommissionAmount) : 0,
    platformMarkupAmount: snapshot ? Number(snapshot.platformMarkupAmount) : 0,
    optionalExtrasAmount: snapshot ? Number(snapshot.optionalExtrasAmount) : 0,
    customerTotalAmount: snapshot ? Number(snapshot.customerTotalAmount) : Number(booking.totalAmount),
    providerExpectedPayout: snapshot ? Number(snapshot.providerExpectedPayout) : 0,

    bookingStatus: booking.bookingStatus,
  };
}
