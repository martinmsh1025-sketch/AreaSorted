import { getBookingRecordByReference } from "@/lib/booking-record-store";

type BookingManagePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingManagePage({ searchParams }: BookingManagePageProps) {
  const params = (await searchParams) ?? {};
  const reference = typeof params.reference === "string" ? params.reference : "";
  const token = typeof params.token === "string" ? params.token : "";
  const booking = reference ? await getBookingRecordByReference(reference) : null;

  const isValid = Boolean(booking && booking.accessToken && token && booking.accessToken === token);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Manage booking</div>
          {!isValid || !booking ? (
            <>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Booking link invalid or expired.
              </h1>
              <p className="lead">Please use the original email link or contact WashHub support for help.</p>
            </>
          ) : (
            <>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Booking {booking.bookingReference}
              </h1>
              <div className="quote-summary-list" style={{ marginTop: "1.25rem" }}>
                <div><span>Name</span><strong>{booking.customerName}</strong></div>
                <div><span>Email</span><strong>{booking.email}</strong></div>
                <div><span>Phone</span><strong>{booking.contactPhone}</strong></div>
                <div><span>Service</span><strong>{booking.service}</strong></div>
                <div><span>Date</span><strong>{booking.preferredDate}</strong></div>
                <div><span>Time</span><strong>{booking.preferredTime}</strong></div>
                <div><span>Payment status</span><strong>{booking.stripePaymentStatus.toUpperCase()}</strong></div>
              </div>
              <div className="button-row" style={{ marginTop: "1.25rem" }}>
                <a className="button button-secondary" href="/contact">Contact support</a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
