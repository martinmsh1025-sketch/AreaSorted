import { getPrisma } from "@/lib/db";

type BookingManagePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingManagePage({ searchParams }: BookingManagePageProps) {
  const params = (await searchParams) ?? {};
  const reference = typeof params.reference === "string" ? params.reference : "";

  const prisma = getPrisma();

  const booking = reference
    ? await prisma.booking.findFirst({
        where: {
          OR: [
            { quoteRequest: { reference } },
            { id: reference },
          ],
        },
        include: {
          customer: true,
          quoteRequest: true,
          paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      })
    : null;

  const paymentStatus =
    booking?.paymentRecords?.[0]?.paymentState ?? booking?.bookingStatus ?? "UNKNOWN";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Manage booking</div>
          {!booking ? (
            <>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Booking not found.
              </h1>
              <p className="lead">
                The booking reference may be invalid or the booking no longer exists. Please contact AreaSorted support for help.
              </p>
            </>
          ) : (
            <>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Booking {booking.quoteRequest?.reference ?? reference}
              </h1>
              <div className="quote-summary-list" style={{ marginTop: "1.25rem" }}>
                <div>
                  <span>Name</span>
                  <strong>{booking.customer.firstName} {booking.customer.lastName}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{booking.customer.email}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{booking.customer.phone}</strong>
                </div>
                <div>
                  <span>Service</span>
                  <strong>{booking.quoteRequest?.serviceKey ?? booking.serviceType}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{booking.scheduledDate.toLocaleDateString("en-GB")}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{booking.scheduledStartTime}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{booking.bookingStatus.replace(/_/g, " ")}</strong>
                </div>
                <div>
                  <span>Payment status</span>
                  <strong>{String(paymentStatus).replace(/_/g, " ")}</strong>
                </div>
              </div>
              <div className="button-row" style={{ marginTop: "1.25rem" }}>
                <a className="button button-secondary" href="/support">Contact support</a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
