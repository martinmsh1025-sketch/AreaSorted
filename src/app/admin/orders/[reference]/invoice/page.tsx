import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrCreateInvoices, loadBookingForInvoice } from "@/server/services/invoices/generate";
import { buildInvoiceData } from "@/server/services/invoices/build-data";
import { AdminInvoice, InvoicePrintButton } from "@/components/invoice/invoice-templates";

type Props = {
  params: Promise<{ reference: string }>;
};

export default async function AdminInvoicePage({ params }: Props) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { reference } = await params;

  // Admin pages use booking.id as reference
  const fullBooking = await loadBookingForInvoice(reference);
  if (!fullBooking) notFound();

  // Only show invoice for paid/completed bookings
  const invoiceableStatuses = [
    "PAID",
    "PENDING_ASSIGNMENT",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
  ];
  if (!invoiceableStatuses.includes(fullBooking.bookingStatus)) {
    notFound();
  }

  // Generate or fetch existing invoices
  const invoices = await getOrCreateInvoices(fullBooking.id);
  // For admin, use the customer invoice number (it's the primary invoice)
  const primaryInvoice = invoices.find((inv) => inv.variant === "customer") ?? invoices[0];
  if (!primaryInvoice) notFound();

  const data = buildInvoiceData(fullBooking, primaryInvoice.number);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/admin/orders/${reference}`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          &larr; Back to booking
        </Link>
        <InvoicePrintButton />
      </div>
      <AdminInvoice data={data} />
    </div>
  );
}
