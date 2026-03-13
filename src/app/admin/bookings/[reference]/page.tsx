import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getBookingRecordByReference } from "@/lib/booking-record-store";
import { updateBookingStatusAction } from "./actions";

type AdminBookingDetailPageProps = {
  params: Promise<{ reference: string }>;
};

function formatService(value?: string) {
  if (!value) return "-";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { reference } = await params;
  const booking = await getBookingRecordByReference(reference);

  if (!booking) notFound();

  const serviceAddress = [booking.addressLine1, booking.addressLine2, booking.city, booking.postcode].filter(Boolean).join(", ");
  const billingAddress = [booking.billingAddressLine1, booking.billingAddressLine2, booking.billingCity, booking.billingPostcode]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 820, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin booking</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            {booking.bookingReference}
          </h1>
          <p className="lead">Review the full booking and update operational statuses from one place.</p>
        </div>

        <div className="quote-page-grid">
          <section className="quote-form-sections">
            <div className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Customer</div>
                <strong>Customer and contact</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Name</span><strong>{booking.customerName || "-"}</strong></div>
                <div><span>Email</span><strong>{booking.email || "-"}</strong></div>
                <div><span>Phone</span><strong>{booking.contactPhone || "-"}</strong></div>
                <div><span>Booking status</span><strong>{booking.bookingStatus || "-"}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Cleaner</div>
                <strong>Assigned cleaner and earnings</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Cleaner ID</span><strong>{booking.cleanerId || "Unassigned"}</strong></div>
                <div>
                  <span>Cleaner name</span>
                  <strong>
                    {booking.cleanerEmail ? (
                      <a href={`/cleaner/jobs?email=${encodeURIComponent(booking.cleanerEmail)}`} style={{ color: "var(--color-accent)" }}>
                        {booking.cleanerName || booking.cleanerEmail}
                      </a>
                    ) : (
                      booking.cleanerName || "Unassigned"
                    )}
                  </strong>
                </div>
                <div><span>Cleaner email</span><strong>{booking.cleanerEmail || "-"}</strong></div>
                <div><span>Cleaner pay</span><strong>GBP {(booking.cleanerPayoutAmount || 0).toFixed(2)}</strong></div>
                <div><span>Platform earnings</span><strong>GBP {(booking.platformEarningsAmount || 0).toFixed(2)}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Service</div>
                <strong>Booking details</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Service</span><strong>{formatService(booking.service)}</strong></div>
                <div><span>Address</span><strong>{serviceAddress || booking.postcode || "-"}</strong></div>
                <div><span>Service date</span><strong>{booking.preferredDate || "-"}</strong></div>
                <div><span>Service time</span><strong>{booking.preferredTime || "-"}</strong></div>
                <div><span>Hours</span><strong>{booking.estimatedHours ? `${booking.estimatedHours} hours` : "-"}</strong></div>
                <div><span>Add-ons</span><strong>{booking.addOns?.length ? booking.addOns.join(", ") : "None"}</strong></div>
                <div><span>Billing address</span><strong>{billingAddress || "Same as service address"}</strong></div>
                <div><span>Booked at</span><strong>{booking.createdAt}</strong></div>
                <div><span>Last updated</span><strong>{booking.updatedAt}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Notes</div>
                <strong>Special notes</strong>
              </div>
              <div className="quote-summary-list">
                <div><span>Additional requests</span><strong>{booking.additionalRequests || "None"}</strong></div>
                <div><span>Entry notes</span><strong>{booking.entryNotes || "None"}</strong></div>
                <div><span>Parking notes</span><strong>{booking.parkingNotes || "None"}</strong></div>
              </div>
            </div>
          </section>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Status control</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Update workflow</h2>
              <form action={updateBookingStatusAction} className="mini-form" style={{ padding: 0 }}>
                <input type="hidden" name="bookingReference" value={booking.bookingReference} />

                <label className="quote-field-stack">
                  <span>Cleaner ID</span>
                  <input name="cleanerId" defaultValue={booking.cleanerId || ""} />
                </label>

                <label className="quote-field-stack">
                  <span>Cleaner name</span>
                  <input name="cleanerName" defaultValue={booking.cleanerName || ""} />
                </label>

                <label className="quote-field-stack">
                  <span>Cleaner email</span>
                  <input name="cleanerEmail" defaultValue={booking.cleanerEmail || ""} />
                </label>

                <label className="quote-field-stack">
                  <span>Cleaner pay</span>
                  <input name="cleanerPayoutAmount" type="number" step="0.01" defaultValue={booking.cleanerPayoutAmount || 0} />
                </label>

                <label className="quote-field-stack">
                  <span>Platform earnings</span>
                  <input name="platformEarningsAmount" type="number" step="0.01" defaultValue={booking.platformEarningsAmount || 0} />
                </label>

                <label className="quote-field-stack">
                  <span>Payment</span>
                  <select name="stripePaymentStatus" defaultValue={booking.stripePaymentStatus || "pending"}>
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="cancelled">cancelled</option>
                    <option value="failed">failed</option>
                  </select>
                </label>

                <label className="quote-field-stack">
                  <span>Assignment</span>
                  <select name="assignmentStatus" defaultValue={booking.assignmentStatus || "unassigned"}>
                    <option value="unassigned">unassigned</option>
                    <option value="offering">offering</option>
                    <option value="assigned">assigned</option>
                    <option value="accepted">accepted</option>
                    <option value="reassigned">reassigned</option>
                  </select>
                </label>

                <label className="quote-field-stack">
                  <span>Job</span>
                  <select name="jobStatus" defaultValue={booking.jobStatus || "pending"}>
                    <option value="pending">pending</option>
                    <option value="scheduled">scheduled</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                    <option value="no_show">no_show</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </label>

                <label className="quote-field-stack">
                  <span>Refund</span>
                  <select name="refundStatus" defaultValue={booking.refundStatus || "not_requested"}>
                    <option value="not_requested">not_requested</option>
                    <option value="pending">pending</option>
                    <option value="refunded">refunded</option>
                    <option value="partial_refund">partial_refund</option>
                    <option value="declined">declined</option>
                  </select>
                </label>

                <button className="button button-primary" type="submit">Save statuses</button>
              </form>
            </section>

            <section className="panel card">
              <div className="eyebrow">Amount</div>
              <div className="quote-total-number">GBP {booking.totalAmount.toFixed(2)}</div>
              <p className="lead" style={{ marginBottom: 0 }}>Stripe session: {booking.stripeSessionId || "Pending"}</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
