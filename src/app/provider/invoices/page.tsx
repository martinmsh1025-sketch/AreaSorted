import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import Link from "next/link";
import { FileText, ExternalLink, Receipt } from "lucide-react";

export default async function ProviderInvoicesPage() {
  const session = await requireProviderOrdersAccess();
  const prisma = getPrisma();

  const invoices = await prisma.invoiceRecord.findMany({
    where: {
      providerCompanyId: session.providerCompany.id,
      strategy: "PROVIDER_SERVICE_PLUS_PLATFORM_FEE_RECEIPT",
    },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        select: {
          id: true,
          bookingStatus: true,
          scheduledDate: true,
          scheduledStartTime: true,
          quoteRequest: {
            select: {
              reference: true,
              serviceKey: true,
              categoryKey: true,
            },
          },
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          payoutRecords: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              status: true,
              holdUntil: true,
              releasedAt: true,
              paidAt: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Remittance advices for your completed and in-progress orders.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Receipt className="mx-auto size-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No invoices yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Remittance advices will appear here once you have paid orders.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium px-4 py-3">Invoice #</th>
                  <th className="text-left font-medium px-4 py-3">Date</th>
                  <th className="text-left font-medium px-4 py-3">Service</th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-right font-medium px-4 py-3">Payout</th>
                  <th className="text-left font-medium px-4 py-3">Payout Status</th>
                  <th className="text-left font-medium px-4 py-3">Order Status</th>
                  <th className="text-right font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const booking = inv.booking;
                  const scheduledDate = booking?.scheduledDate
                    ? new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const customerName = booking?.customer
                    ? `${booking.customer.firstName} ${booking.customer.lastName}`
                    : "—";
                  const serviceLabel = booking?.quoteRequest?.serviceKey
                    ? formatServiceKey(booking.quoteRequest.serviceKey)
                    : booking?.quoteRequest?.categoryKey
                      ? formatServiceKey(booking.quoteRequest.categoryKey)
                      : "—";
                  const statusLabel = booking?.bookingStatus
                    ? formatStatus(booking.bookingStatus)
                    : "—";
                  const statusColor = booking?.bookingStatus
                    ? getStatusColor(booking.bookingStatus)
                    : "text-muted-foreground";
                  const payout = booking?.payoutRecords?.[0];
                  const payoutLabel = payout?.status ? formatStatus(payout.status) : "—";

                  return (
                    <tr key={inv.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs">{inv.number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {scheduledDate}
                      </td>
                      <td className="px-4 py-3">{serviceLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">{customerName}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        £{Number(inv.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{payoutLabel}</div>
                        {payout?.holdUntil && <div>Hold until {new Date(payout.holdUntil).toLocaleDateString("en-GB")}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {booking && (
                          <Link
                            href={`/provider/orders/${booking.id}/invoice`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View
                            <ExternalLink className="size-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────── */

function formatServiceKey(key: string): string {
  return key
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "text-green-600";
    case "PAID":
    case "ASSIGNED":
    case "IN_PROGRESS":
    case "PENDING_ASSIGNMENT":
      return "text-blue-600";
    case "CANCELLED":
    case "REFUNDED":
    case "REFUND_PENDING":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}
