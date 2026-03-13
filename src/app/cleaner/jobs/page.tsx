import { redirect } from "next/navigation";
import { getAuthenticatedCleanerEmail } from "@/lib/cleaner-auth";
import { listCleanerBookings } from "@/lib/booking-record-store";
import { cleanerLogoutAction } from "../login/actions";

type CleanerJobsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatService(value?: string) {
  if (!value) return "-";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CleanerJobsPage({ searchParams }: CleanerJobsPageProps) {
  const authenticatedEmail = await getAuthenticatedCleanerEmail();
  if (!authenticatedEmail) redirect("/cleaner/login");

  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const startDate = typeof params.startDate === "string" ? params.startDate : "";
  const endDate = typeof params.endDate === "string" ? params.endDate : "";
  const jobStatus = typeof params.jobStatus === "string" ? params.jobStatus : "";
  const bookings = await listCleanerBookings(authenticatedEmail);

  const filteredBookings = bookings.filter((booking) => {
    const queryMatch = !query || [booking.bookingReference, booking.service, booking.postcode]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
    const startMatch = !startDate || booking.preferredDate >= startDate;
    const endMatch = !endDate || booking.preferredDate <= endDate;
    const statusMatch = !jobStatus || booking.jobStatus === jobStatus;
    return queryMatch && startMatch && endMatch && statusMatch;
  });

  const upcoming = filteredBookings.filter((booking) => booking.jobStatus !== "completed");
  const past = filteredBookings.filter((booking) => booking.jobStatus === "completed");
  const cleanerTotal = filteredBookings.reduce((sum, booking) => sum + (booking.cleanerPayoutAmount || 0), 0);
  const platformTotal = filteredBookings.reduce((sum, booking) => sum + (booking.platformEarningsAmount || 0), 0);

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 820, marginBottom: "2rem" }}>
          <div className="eyebrow">Cleaner jobs</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            Jobs and earnings
          </h1>
          <p className="lead">
            View upcoming jobs, past jobs, cleaner earnings, and platform earnings.
          </p>
        </div>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="quote-summary-list">
            <div><span>Cleaner account</span><strong>{authenticatedEmail}</strong></div>
            <div><span>Total visible jobs</span><strong>{filteredBookings.length}</strong></div>
            <div><span>Completed jobs</span><strong>{past.length}</strong></div>
            <div><span>Upcoming jobs</span><strong>{upcoming.length}</strong></div>
          </div>
        </section>

        <section className="panel card admin-filter-shell" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-filter-header">
            <div>
              <div className="eyebrow">Cleaner account</div>
              <div className="admin-filter-title">{authenticatedEmail}</div>
              <p className="admin-filter-subtitle">Filter jobs by date range, job status, or booking reference.</p>
            </div>
            <form action={cleanerLogoutAction}>
              <button className="button button-secondary" type="submit">Logout</button>
            </form>
          </div>
          <form method="GET" className="admin-filter-grid">
            <label className="quote-field-stack admin-filter-span-6">
              <span>Search</span>
              <input name="q" defaultValue={query} placeholder="Booking ref, service, postcode" />
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
              <span>Job status</span>
              <select name="jobStatus" defaultValue={jobStatus}>
                <option value="">All</option>
                <option value="pending">pending</option>
                <option value="scheduled">scheduled</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="no_show">no_show</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
            <div className="admin-filter-actions admin-filter-span-6">
              <button className="button button-primary" type="submit">Apply filters</button>
              <a className="button button-secondary" href="/cleaner/jobs">Reset</a>
            </div>
          </form>
        </section>

        <section className="section-card-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="span-4 panel card">
            <div className="eyebrow">Upcoming</div>
            <strong style={{ fontSize: "1.8rem" }}>{upcoming.length}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Upcoming jobs</p>
          </div>
          <div className="span-4 panel card">
            <div className="eyebrow">Cleaner total</div>
            <strong style={{ fontSize: "1.8rem" }}>GBP {cleanerTotal.toFixed(2)}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Cleaner earnings</p>
          </div>
          <div className="span-4 panel card">
            <div className="eyebrow">Platform total</div>
            <strong style={{ fontSize: "1.8rem" }}>GBP {platformTotal.toFixed(2)}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>WashHub earnings</p>
          </div>
        </section>

        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Upcoming jobs</div>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            {upcoming.length ? upcoming.map((booking) => (
              <div key={`upcoming-${booking.bookingReference}`}>
                <span>{booking.bookingReference}</span>
                <strong>{formatService(booking.service)} - service on {booking.preferredDate} at {booking.preferredTime} - GBP {(booking.cleanerPayoutAmount || 0).toFixed(2)}</strong>
              </div>
            )) : <div><span>No upcoming jobs</span><strong>-</strong></div>}
          </div>
        </section>

        <section className="panel card">
          <div className="eyebrow">Past jobs</div>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            {past.length ? past.map((booking) => (
              <div key={`past-${booking.bookingReference}`}>
                <span>{booking.bookingReference}</span>
                <strong>{formatService(booking.service)} - service on {booking.preferredDate} at {booking.preferredTime} - GBP {(booking.cleanerPayoutAmount || 0).toFixed(2)}</strong>
              </div>
            )) : <div><span>No past jobs</span><strong>-</strong></div>}
          </div>
        </section>
      </div>
    </main>
  );
}
