import Link from "next/link";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";
import { getDisplayPaymentStatus, getPaymentStatusLabel } from "@/lib/payments/display-status";

export default async function AccountBookingsPage() {
  const customer = await requireCustomerSession();
  const prisma = getPrisma();

  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      quoteRequest: { select: { reference: true, serviceKey: true } },
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1, select: { paymentState: true, metadataJson: true } },
      counterOffers: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
  });

  const pendingOfferCount = bookings.filter((booking) => booking.counterOffers.length > 0).length;

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <Link href="/account" style={{ color: "var(--color-brand)", fontSize: "0.9rem", fontWeight: 600 }}>
            &larr; Back to account
          </Link>
        </div>

        <div className="panel card">
          <div className="eyebrow">My account</div>
          <h1 className="title" style={{ marginTop: "0.3rem", fontSize: "1.5rem", marginBottom: "1.25rem" }}>
            All bookings
          </h1>
          {pendingOfferCount > 0 && (
            <div style={{ marginBottom: "1.25rem", padding: "0.9rem 1rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, #fff0f0 0%, #fff 100%)", border: "1px solid rgba(217,37,42,0.18)" }}>
              <strong style={{ display: "block", marginBottom: "0.3rem" }}>Action needed</strong>
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>
                {pendingOfferCount} booking{pendingOfferCount === 1 ? "" : "s"} {pendingOfferCount === 1 ? "has" : "have"} a pending provider counter offer. Open the highlighted booking to accept or decline it.
              </p>
            </div>
          )}

          {bookings.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              You don&apos;t have any bookings yet.{" "}
              <Link href="/quote" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
                Continue booking
              </Link>
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {bookings.map((booking) => {
                const ref = booking.quoteRequest?.reference ?? booking.id;
                const service = booking.quoteRequest?.serviceKey ?? booking.serviceType;
                const status = booking.bookingStatus.replace(/_/g, " ");
                const date = booking.scheduledDate.toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                });
                const payment = getDisplayPaymentStatus({
                  paymentState: booking.paymentRecords?.[0]?.paymentState,
                  metadataJson: booking.paymentRecords?.[0]?.metadataJson,
                  bookingStatus: booking.bookingStatus,
                });
                const hasPendingOffer = booking.counterOffers.length > 0;

                return (
                  <Link
                    key={booking.id}
                    href={`/account/bookings/${ref}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: hasPendingOffer
                        ? "2px solid var(--color-brand, #d9252a)"
                        : "1px solid var(--color-border)",
                      textDecoration: "none",
                      color: "inherit",
                      gap: "1rem",
                      flexWrap: "wrap",
                      background: hasPendingOffer ? "linear-gradient(135deg, #fef3f3 0%, #fff 100%)" : undefined,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>{service}</strong>
                      {hasPendingOffer && (
                        <span
                          style={{
                            display: "inline-block",
                            marginLeft: "0.5rem",
                            background: "var(--color-brand, #d9252a)",
                            color: "#fff",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            padding: "0.1rem 0.45rem",
                            borderRadius: "0.2rem",
                            verticalAlign: "middle",
                          }}
                        >
                          Offer pending
                        </span>
                      )}
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                        {ref} &middot; {date} at {booking.scheduledStartTime}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        color: booking.bookingStatus === "COMPLETED" ? "var(--color-success, #16a34a)" :
                               booking.bookingStatus === "CANCELLED" ? "var(--color-error)" :
                               "var(--color-text-muted)",
                      }}>
                        {status}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>
                        Payment: {getPaymentStatusLabel(payment).toLowerCase()}
                      </div>
                      {hasPendingOffer && (
                        <div style={{ fontSize: "0.78rem", color: "var(--color-brand, #d9252a)", fontWeight: 700, marginTop: "0.25rem" }}>
                          Open to respond
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
