import Link from "next/link";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";

export default async function AccountBookingsPage() {
  const customer = await requireCustomerSession();
  const prisma = getPrisma();

  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      quoteRequest: { select: { reference: true, serviceKey: true } },
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

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

          {bookings.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              You don&apos;t have any bookings yet.{" "}
              <Link href="/quote" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
                Get a quote
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
                const payment = booking.paymentRecords?.[0]?.paymentState ?? "UNKNOWN";

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
                      border: "1px solid var(--color-border)",
                      textDecoration: "none",
                      color: "inherit",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>{service}</strong>
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
                        Payment: {String(payment).replace(/_/g, " ").toLowerCase()}
                      </div>
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
