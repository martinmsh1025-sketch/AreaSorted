import { listBookingRecords } from "@/lib/booking-record-store";

function formatService(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  if (!value) return "-";
  return value;
}

export default async function AdminBookingsPage() {
  const bookings = await listBookingRecords();

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 820, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.3rem)" }}>
            Booking list
          </h1>
          <p className="lead">
            View all bookings, payment state, assignment state, job completion, and refund state in one place.
          </p>
        </div>

        <section className="panel card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.9rem 0.75rem" }}>Booking</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Customer</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Service</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Date / Time</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Amount</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Payment</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Assignment</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Job</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Refund</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length ? (
                bookings.map((booking) => (
                  <tr key={booking.bookingReference} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.95rem 0.75rem", fontWeight: 700 }}>{booking.bookingReference}</td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>
                      <div>{booking.customerName || "-"}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.email || "-"}</div>
                    </td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>
                      <div>{formatService(booking.service || "")}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.postcode || "-"}</div>
                    </td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>
                      <div>{formatDate(booking.preferredDate)}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.preferredTime || "-"}</div>
                    </td>
                    <td style={{ padding: "0.95rem 0.75rem", fontWeight: 700 }}>GBP {booking.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>{booking.stripePaymentStatus || "pending"}</td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>{booking.assignmentStatus || "unassigned"}</td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>{booking.jobStatus || "pending"}</td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>{booking.refundStatus || "not_requested"}</td>
                    <td style={{ padding: "0.95rem 0.75rem", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.updatedAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ padding: "1.25rem 0.75rem", color: "var(--color-text-muted)" }}>
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
