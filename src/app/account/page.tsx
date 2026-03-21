import Link from "next/link";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";
import { customerLogoutAction } from "@/app/customer/login/actions";
import { EditProfileSection } from "./edit-profile-section";

export default async function AccountDashboardPage() {
  const customer = await requireCustomerSession();
  const prisma = getPrisma();

  const recentBookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      quoteRequest: { select: { reference: true, serviceKey: true } },
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const totalBookings = await prisma.booking.count({ where: { customerId: customer.id } });

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="eyebrow">My account</div>
              <h1 className="title" style={{ marginTop: "0.3rem", fontSize: "1.5rem" }}>
                Welcome back, {customer.firstName}
              </h1>
              <p className="lead" style={{ fontSize: "0.95rem" }}>{customer.email}</p>
            </div>
            <form action={customerLogoutAction}>
              <button type="submit" className="button button-secondary" style={{ fontSize: "0.85rem" }}>
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Recent bookings</h2>
            {totalBookings > 5 && (
              <Link href="/account/bookings" style={{ color: "var(--color-brand)", fontSize: "0.9rem", fontWeight: 600 }}>
                View all ({totalBookings})
              </Link>
            )}
          </div>

          {recentBookings.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              You don&apos;t have any bookings yet.{" "}
              <Link href="/quote" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
                Get a quote
              </Link>
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentBookings.map((booking) => {
                const ref = booking.quoteRequest?.reference ?? booking.id;
                const service = booking.quoteRequest?.serviceKey ?? booking.serviceType;
                const status = booking.bookingStatus.replace(/_/g, " ");
                const date = booking.scheduledDate.toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                });

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
                        {date} at {booking.scheduledStartTime}
                      </div>
                    </div>
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
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Account details</h2>
          <EditProfileSection
            customer={{
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
            }}
          />
          <div className="quote-summary-list" style={{ marginTop: "0.75rem" }}>
            <div><span>Member since</span><strong>{customer.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</strong></div>
          </div>
        </div>
      </div>
    </main>
  );
}
