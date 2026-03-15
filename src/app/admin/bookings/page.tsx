import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getBookingDashboardSummary, listBookingRecords } from "@/lib/booking-record-store";

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

type AdminBookingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const bookings = await listBookingRecords();
  const summary = await getBookingDashboardSummary();
  const today = new Date().toISOString().slice(0, 10);
  const todaysJobs = bookings
    .filter((booking) => booking.preferredDate === today)
    .sort((left, right) => (left.preferredTime > right.preferredTime ? 1 : -1));
  const todaysNoShows = todaysJobs.filter((booking) => booking.jobStatus === "no_show").length;
  const todaysCompleted = todaysJobs.filter((booking) => booking.jobStatus === "completed").length;
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const paymentFilter = typeof params.payment === "string" ? params.payment : "";
  const assignmentFilter = typeof params.assignment === "string" ? params.assignment : "";
  const refundFilter = typeof params.refund === "string" ? params.refund : "";
  const startDate = typeof params.startDate === "string" ? params.startDate : "";
  const endDate = typeof params.endDate === "string" ? params.endDate : "";
  const sortBy = typeof params.sortBy === "string" ? params.sortBy : "serviceDateAsc";

  const filteredBookings = bookings.filter((booking) => {
    const queryMatch =
      !query ||
      [booking.bookingReference, booking.customerName, booking.email, booking.contactPhone, booking.postcode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

    const serviceDateMatch =
      (!startDate || booking.preferredDate >= startDate) &&
      (!endDate || booking.preferredDate <= endDate);
    const paymentMatch = !paymentFilter || booking.stripePaymentStatus === paymentFilter;
    const assignmentMatch = !assignmentFilter || booking.assignmentStatus === assignmentFilter;
    const refundMatch = !refundFilter || booking.refundStatus === refundFilter;

    return queryMatch && serviceDateMatch && paymentMatch && assignmentMatch && refundMatch;
  }).sort((left, right) => {
    if (sortBy === "serviceDateDesc") return left.preferredDate < right.preferredDate ? 1 : -1;
    if (sortBy === "createdAtDesc") return left.createdAt < right.createdAt ? 1 : -1;
    if (sortBy === "createdAtAsc") return left.createdAt > right.createdAt ? 1 : -1;
    return left.preferredDate > right.preferredDate ? 1 : -1;
  });

  const exportParams = new URLSearchParams();
  if (startDate) exportParams.set("date", startDate);
  if (paymentFilter) exportParams.set("payment", paymentFilter);

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

        <section className="section-card-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Today</div>
            <strong className="admin-stat-number">GBP {summary.totalTransactionAmount.toFixed(2)}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Total transaction amount</p>
          </div>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Cancelled</div>
            <strong className="admin-stat-number">GBP {summary.totalCancelledAmount.toFixed(2)}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Value of cancelled jobs</p>
          </div>
          <div className="span-4 panel card admin-stat-card">
            <div className="eyebrow">Refunded</div>
            <strong className="admin-stat-number">GBP {summary.totalRefundAmount.toFixed(2)}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Refunded amount today</p>
          </div>
        </section>

        <section className="panel card admin-filter-shell" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-filter-header">
            <div>
              <div className="eyebrow">Today jobs monitor</div>
              <div className="admin-filter-title">Live operational view for {today}</div>
              <p className="admin-filter-subtitle">See how many jobs are due today, what time they are scheduled, whether they are completed, and whether any have become no-shows.</p>
            </div>
          </div>

          <div className="section-card-grid" style={{ marginBottom: "1rem" }}>
            <div className="span-4 panel card admin-stat-card">
              <div className="eyebrow">Jobs today</div>
              <strong className="admin-stat-number">{todaysJobs.length}</strong>
              <p className="lead" style={{ marginBottom: 0 }}>Scheduled service visits today</p>
            </div>
            <div className="span-4 panel card admin-stat-card">
              <div className="eyebrow">Completed today</div>
              <strong className="admin-stat-number">{todaysCompleted}</strong>
              <p className="lead" style={{ marginBottom: 0 }}>Jobs already marked completed</p>
            </div>
            <div className="span-4 panel card admin-stat-card">
              <div className="eyebrow">No-shows</div>
              <strong className="admin-stat-number">{todaysNoShows}</strong>
              <p className="lead" style={{ marginBottom: 0 }}>Jobs currently marked no-show</p>
            </div>
          </div>

          <div className="admin-table-shell" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead className="admin-table-head">
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "0.9rem 0.75rem" }}>Time</th>
                  <th style={{ padding: "0.9rem 0.75rem" }}>Booking</th>
                  <th style={{ padding: "0.9rem 0.75rem" }}>Customer</th>
                  <th style={{ padding: "0.9rem 0.75rem" }}>Cleaner</th>
                  <th style={{ padding: "0.9rem 0.75rem" }}>Job state</th>
                  <th style={{ padding: "0.9rem 0.75rem" }}>Payment</th>
                </tr>
              </thead>
              <tbody>
                {todaysJobs.length ? (
                  todaysJobs.map((booking) => (
                    <tr key={`today-${booking.bookingReference}`} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "0.95rem 0.75rem", fontWeight: 700 }}>{booking.preferredTime || "-"}</td>
                      <td style={{ padding: "0.95rem 0.75rem" }}>
                        <a href={`/admin/bookings/${booking.bookingReference}`} className="admin-booking-link">{booking.bookingReference}</a>
                      </td>
                      <td style={{ padding: "0.95rem 0.75rem" }}>{booking.customerName || "-"}</td>
                      <td style={{ padding: "0.95rem 0.75rem" }}>{booking.cleanerName || "Unassigned"}</td>
                      <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{booking.jobStatus || "pending"}</span></td>
                      <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{booking.stripePaymentStatus || "pending"}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: "1rem 0.75rem", color: "var(--color-text-muted)" }}>No jobs scheduled for today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel card admin-filter-shell" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-filter-header">
            <div>
              <div className="eyebrow">Filters and export</div>
              <div className="admin-filter-title">Daily operations view</div>
              <p className="admin-filter-subtitle">Filter by date range, payment state, assignment state, and refund state, then export the matching records to CSV.</p>
            </div>
          </div>
          <form method="GET" className="admin-filter-grid">
            <label className="quote-field-stack admin-filter-span-6">
              <span>Search</span>
              <input name="q" defaultValue={query} placeholder="Booking ref, customer, email, phone, postcode" />
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>Start date</span>
              <input type="date" name="startDate" defaultValue={startDate} />
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>End date</span>
              <input type="date" name="endDate" defaultValue={endDate} />
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>Payment</span>
              <select name="payment" defaultValue={paymentFilter}>
                <option value="">All</option>
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="cancelled">cancelled</option>
                <option value="failed">failed</option>
              </select>
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>Assignment</span>
              <select name="assignment" defaultValue={assignmentFilter}>
                <option value="">All</option>
                <option value="unassigned">unassigned</option>
                <option value="offering">offering</option>
                <option value="assigned">assigned</option>
                <option value="accepted">accepted</option>
                <option value="reassigned">reassigned</option>
              </select>
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>Refund</span>
              <select name="refund" defaultValue={refundFilter}>
                <option value="">All</option>
                <option value="not_requested">not_requested</option>
                <option value="pending">pending</option>
                <option value="refunded">refunded</option>
                <option value="partial_refund">partial_refund</option>
                <option value="declined">declined</option>
              </select>
            </label>
            <label className="quote-field-stack admin-filter-span-3">
              <span>Sort by</span>
              <select name="sortBy" defaultValue={sortBy}>
                <option value="serviceDateAsc">service date ascending</option>
                <option value="serviceDateDesc">service date descending</option>
                <option value="createdAtDesc">created date descending</option>
                <option value="createdAtAsc">created date ascending</option>
              </select>
            </label>
            <div className="admin-filter-actions admin-filter-span-6">
              <button className="button button-primary" type="submit">Apply filters</button>
              <a className="button button-secondary" href="/admin/bookings">Reset</a>
              <a className="button button-secondary" href={`/admin/bookings/export?${exportParams.toString()}`}>Export CSV</a>
            </div>
          </form>
        </section>

        <section className="panel card admin-table-shell" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
            <thead className="admin-table-head">
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.9rem 0.75rem" }}>Booking</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Customer</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Service</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Service date / time</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Amount</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Cleaner</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Cleaner Pay</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Platform</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Payment</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Assignment</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Job</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Refund</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Booked at</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.bookingReference} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.95rem 0.75rem", fontWeight: 700 }}>
                      <a href={`/admin/bookings/${booking.bookingReference}`} className="admin-booking-link">
                        {booking.bookingReference}
                      </a>
                    </td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>
                      <div>{booking.customerName || "-"}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.email || "-"}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.contactPhone || "-"}</div>
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
                    <td style={{ padding: "0.95rem 0.75rem" }}>
                      <div>
                        {booking.cleanerEmail ? (
                          <a href={`/cleaner/jobs?email=${encodeURIComponent(booking.cleanerEmail)}`} style={{ color: "var(--color-accent)", fontWeight: 700 }}>
                            {booking.cleanerName || booking.cleanerEmail}
                          </a>
                        ) : (
                          booking.cleanerName || "Unassigned"
                        )}
                      </div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.cleanerEmail || "-"}</div>
                    </td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>GBP {(booking.cleanerPayoutAmount || 0).toFixed(2)}</td>
                    <td style={{ padding: "0.95rem 0.75rem" }}>GBP {(booking.platformEarningsAmount || 0).toFixed(2)}</td>
                    <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{booking.stripePaymentStatus || "pending"}</span></td>
                    <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{booking.assignmentStatus || "unassigned"}</span></td>
                    <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{booking.jobStatus || "pending"}</span></td>
                    <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{booking.refundStatus || "not_requested"}</span></td>
                    <td style={{ padding: "0.95rem 0.75rem", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.createdAt}</td>
                    <td style={{ padding: "0.95rem 0.75rem", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{booking.updatedAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} style={{ padding: "1.25rem 0.75rem", color: "var(--color-text-muted)" }}>
                    No bookings found for the current filters.
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
