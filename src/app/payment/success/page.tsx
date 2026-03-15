import { getBookingRecordBySessionId, markBookingPaymentStatusBySessionId } from "@/lib/booking-record-store";
import { buildBookingConfirmationEmail } from "@/lib/booking-email";
import { getStripe } from "@/lib/stripe";

type PaymentSuccessPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const params = (await searchParams) ?? {};
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  let bookingReference = "";
  let bookingDetails: Awaited<ReturnType<typeof getBookingRecordBySessionId>> = null;

  if (sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await markBookingPaymentStatusBySessionId(sessionId, "paid");
      }

      bookingDetails = await getBookingRecordBySessionId(sessionId);
      bookingReference = bookingDetails?.bookingReference || "";
    } catch {
      bookingReference = "";
    }
  }

  const serviceAddress = bookingDetails
    ? [bookingDetails.addressLine1, bookingDetails.addressLine2, bookingDetails.city, bookingDetails.postcode].filter(Boolean).join(", ")
    : "";

  const billingAddress = bookingDetails
    ? [bookingDetails.billingAddressLine1, bookingDetails.billingAddressLine2, bookingDetails.billingCity, bookingDetails.billingPostcode]
        .filter(Boolean)
        .join(", ")
    : "";

  const emailPreview = bookingDetails ? buildBookingConfirmationEmail(bookingDetails) : null;

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 980 }}>
        <div className="panel card">
          <div className="eyebrow">Payment success</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Payment received.
          </h1>
          <p className="lead">
            Stripe has confirmed the payment. The booking can now move into provider dispatch and slot confirmation.
          </p>
          {bookingReference ? (
            <p style={{ color: "var(--color-text)", fontWeight: 700 }}>
              Booking reference: {bookingReference}
            </p>
          ) : null}
          {bookingDetails ? (
            <div className="quote-page-grid" style={{ marginTop: "1.5rem" }}>
              <section className="quote-form-sections">
                <div className="panel card quote-section-card">
                  <div className="quote-section-head">
                    <div className="eyebrow">Customer</div>
                    <strong>Booking confirmation</strong>
                  </div>
                  <div className="quote-summary-list">
                    <div><span>Name</span><strong>{bookingDetails.customerName}</strong></div>
                    <div><span>Email</span><strong>{bookingDetails.email}</strong></div>
                    <div><span>Phone</span><strong>{bookingDetails.contactPhone}</strong></div>
                    <div><span>Payment status</span><strong>{bookingDetails.stripePaymentStatus.toUpperCase()}</strong></div>
                  </div>
                </div>
                <div className="panel card quote-section-card">
                  <div className="quote-section-head">
                    <div className="eyebrow">Service</div>
                    <strong>Service summary</strong>
                  </div>
                  <div className="quote-summary-list">
                    <div><span>Service</span><strong>{bookingDetails.service}</strong></div>
                    <div><span>Job type</span><strong>{bookingDetails.jobType || "Pending"}</strong></div>
                    <div><span>Address</span><strong>{serviceAddress || bookingDetails.postcode}</strong></div>
                    <div><span>Date</span><strong>{bookingDetails.preferredDate}</strong></div>
                    <div><span>Time</span><strong>{bookingDetails.preferredTime}</strong></div>
                    <div><span>Coverage zone</span><strong>{bookingDetails.coverageZone || "Pending"}</strong></div>
                    <div><span>Estimated hours</span><strong>{bookingDetails.estimatedHours ? `${bookingDetails.estimatedHours} hours` : "Pending"}</strong></div>
                    <div><span>Add-ons</span><strong>{bookingDetails.addOns?.length ? bookingDetails.addOns.join(", ") : "None"}</strong></div>
                    <div><span>Billing address</span><strong>{billingAddress || "Same as service address"}</strong></div>
                  </div>
                </div>
              </section>

              <aside className="quote-sidebar-stack">
                <section className="panel card quote-summary-panel">
                  <div className="eyebrow">Amount paid</div>
                  <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>
                    GBP {bookingDetails.totalAmount.toFixed(2)}
                  </h2>
                  <p className="lead" style={{ marginBottom: 0 }}>
                    This local confirmation step now carries the booking data needed for customer support and dispatch.
                  </p>
                </section>
              </aside>
            </div>
          ) : null}
          {sessionId ? (
            <p style={{ color: "var(--color-text-muted)", wordBreak: "break-all" }}>
              Stripe session: {sessionId}
            </p>
          ) : null}
          {emailPreview ? (
            <div className="panel card" style={{ marginTop: "1.5rem", textAlign: "left" }}>
              <div className="eyebrow">Confirmation email preview</div>
              <p style={{ marginTop: "0.8rem" }}>
                Subject: <strong>{emailPreview.subject}</strong>
              </p>
              <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                Manage booking link: <a href={emailPreview.manageUrl} style={{ color: "var(--color-accent)", fontWeight: 700 }}>{emailPreview.manageUrl}</a>
              </p>
            </div>
          ) : null}
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <a className="button button-primary" href="/">Back to Home</a>
            <a className="button button-secondary" href="/book">Review Booking</a>
          </div>
        </div>
      </div>
    </main>
  );
}
