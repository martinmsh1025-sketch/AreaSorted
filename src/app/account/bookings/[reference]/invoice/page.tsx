import { notFound } from "next/navigation";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";
import { getOrCreateInvoices, loadBookingForInvoice } from "@/server/services/invoices/generate";
import { buildInvoiceData } from "@/server/services/invoices/build-data";
import { CustomerInvoice, InvoicePrintButton } from "@/components/invoice/invoice-templates";

type Props = {
  params: Promise<{ reference: string }>;
};

export default async function CustomerInvoicePage({ params }: Props) {
  const { reference } = await params;
  const customer = await requireCustomerSession();
  const prisma = getPrisma();

  // Find the booking by quoteRequest reference or booking id
  const booking = await prisma.booking.findFirst({
    where: {
      customerId: customer.id,
      OR: [
        { quoteRequest: { reference } },
        { id: reference },
      ],
    },
    select: { id: true, bookingStatus: true },
  });

  if (!booking) notFound();

  // Only show invoice for paid/completed bookings
  const invoiceableStatuses = [
    "PAID",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
  ];
  if (!invoiceableStatuses.includes(booking.bookingStatus)) {
    notFound();
  }

  // Generate or fetch existing invoices
  const invoices = await getOrCreateInvoices(booking.id);
  const customerInvoice = invoices.find((inv) => inv.variant === "customer");
  if (!customerInvoice) notFound();

  // Load full booking data
  const fullBooking = await loadBookingForInvoice(booking.id);
  if (!fullBooking) notFound();

  const data = buildInvoiceData(fullBooking, customerInvoice.number);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="no-print" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a
            href={`/account/bookings/${reference}`}
            style={{ color: "var(--color-brand)", fontSize: "0.9rem", fontWeight: 600 }}
          >
            &larr; Back to booking
          </a>
          <InvoicePrintButton />
        </div>
        <CustomerInvoice data={data} />
      </div>
    </main>
  );
}
