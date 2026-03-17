import Link from "next/link";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(value);
}

type ProviderOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderOrdersPage({ searchParams }: ProviderOrdersPageProps) {
  const session = await requireProviderOrdersAccess();
  const prisma = getPrisma();
  const params = (await searchParams) ?? {};
  const period = typeof params.period === "string" ? params.period : "daily";
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodStart = period === "monthly" ? startOfMonth : period === "weekly" ? startOfWeek : startOfToday;

  const bookings = await prisma.booking.findMany({
    where: {
      providerCompanyId: session.providerCompany.id,
      createdAt: { gte: periodStart },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const filteredBookings = bookings.filter((booking) => {
    if (!query) return true;
    return [booking.id, booking.servicePostcode, booking.bookingStatus, booking.serviceType].some((value) => String(value || "").toLowerCase().includes(query));
  });

  return (
    <main className="section">
      <div className="container">
        <section className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Orders</div>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Order details</h1>
              <p className="lead">Search live provider orders, review booked amounts, and monitor the jobs that now feed payout expectations.</p>
            </div>
          </div>
          <form method="get" className="admin-filter-grid" style={{ marginTop: "1rem" }}>
            <label className="quote-field-stack admin-filter-span-3"><span>Period</span><select name="period" defaultValue={period}><option value="daily">daily</option><option value="weekly">weekly</option><option value="monthly">monthly</option></select></label>
            <label className="quote-field-stack admin-filter-span-6"><span>Search</span><input name="q" defaultValue={query} placeholder="Order number, postcode, status, service" /></label>
            <div className="admin-filter-actions admin-filter-span-3"><button className="button button-primary" type="submit">Apply</button><Link href="/provider/orders" className="button button-secondary">Reset</Link></div>
          </form>
        </section>

        <section className="panel card admin-table-shell" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead className="admin-table-head">
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.9rem 0.75rem" }}>Order number</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Service</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Postcode</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Scheduled</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Status</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length ? filteredBookings.map((booking) => (
                <tr key={booking.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.95rem 0.75rem", fontWeight: 700 }}>{booking.id}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{booking.serviceType}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{booking.servicePostcode}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{new Date(booking.scheduledDate).toLocaleDateString()} {booking.scheduledStartTime}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{booking.bookingStatus}</td>
                  <td style={{ padding: "0.95rem 0.75rem", fontWeight: 700 }}>{formatMoney(Number(booking.totalAmount))}</td>
                </tr>
              )) : <tr><td colSpan={6} style={{ padding: "1rem 0.75rem" }}>No orders found for this filter.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
