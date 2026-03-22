import Link from "next/link";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";
import { getDisplayPaymentStatus, getPaymentStatusLabel } from "@/lib/payments/display-status";

function money(value: number | null | undefined) {
  return `£${Number(value || 0).toFixed(2)}`;
}

export default async function AccountPaymentsPage() {
  const customer = await requireCustomerSession();
  const prisma = getPrisma();

  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      quoteRequest: { select: { reference: true, serviceKey: true } },
      priceSnapshot: true,
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1, select: { paymentState: true, metadataJson: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="panel card account-hero-card">
        <div className="eyebrow">Payments</div>
        <h1 className="title" style={{ marginTop: "0.3rem", fontSize: "1.5rem" }}>Payment history</h1>
        <p className="lead" style={{ fontSize: "0.95rem" }}>
          Review card holds, captured payments, and released holds across your AreaSorted bookings.
        </p>
      </div>

      <div className="panel card">
        {bookings.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            No payment activity yet. <Link href="/quote" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Start a booking</Link> to see payment history here.
          </p>
        ) : (
          <div className="account-booking-list">
            {bookings.map((booking) => {
              const ref = booking.quoteRequest?.reference ?? booking.id;
              const service = booking.quoteRequest?.serviceKey ?? booking.serviceType;
              const paymentStatus = getDisplayPaymentStatus({
                paymentState: booking.paymentRecords?.[0]?.paymentState,
                metadataJson: booking.paymentRecords?.[0]?.metadataJson,
                bookingStatus: booking.bookingStatus,
              });

              return (
                <Link key={booking.id} href={`/account/bookings/${ref}`} className="account-booking-card">
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>{service}</strong>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                      {booking.scheduledDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="account-booking-card-side" style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{money(booking.priceSnapshot ? Number(booking.priceSnapshot.customerTotalAmount) : 0)}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                      {getPaymentStatusLabel(paymentStatus)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
