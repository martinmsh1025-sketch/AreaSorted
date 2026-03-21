import { notFound } from "next/navigation";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { getOrCreateInvoices, loadBookingForInvoice } from "@/server/services/invoices/generate";
import { buildInvoiceData } from "@/server/services/invoices/build-data";
import { ProviderInvoice, InvoicePrintButton } from "@/components/invoice/invoice-templates";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProviderInvoicePage({ params }: Props) {
  const { id } = await params;
  const session = await requireProviderOrdersAccess();
  const prisma = getPrisma();

  // Verify the booking belongs to this provider
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      providerCompanyId: session.providerCompany.id,
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
  const providerInvoice = invoices.find((inv) => inv.variant === "provider");
  if (!providerInvoice) notFound();

  // Load full booking data
  const fullBooking = await loadBookingForInvoice(booking.id);
  if (!fullBooking) notFound();

  const data = buildInvoiceData(fullBooking, providerInvoice.number);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/provider/orders/${id}`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          &larr; Back to order
        </Link>
        <InvoicePrintButton />
      </div>
      <ProviderInvoice data={data} />
    </div>
  );
}
