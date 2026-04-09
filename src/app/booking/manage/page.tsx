import Link from "next/link";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";

type BookingManagePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingManagePage({ searchParams }: BookingManagePageProps) {
  const params = (await searchParams) ?? {};
  const reference = typeof params.reference === "string" ? params.reference : "";
  const session = await getCustomerSession();

  if (!session) {
    const redirectTo = reference ? `/booking/manage?reference=${encodeURIComponent(reference)}` : "/booking/manage";
    redirect(`/customer/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const prisma = getPrisma();

  const booking = reference
    ? await prisma.booking.findFirst({
        where: {
          customerId: session.id,
          OR: [
            { quoteRequest: { reference } },
            { id: reference },
          ],
        },
        include: { quoteRequest: { select: { reference: true } } },
      })
    : null;

  if (booking) {
    redirect(`/account/bookings/${booking.quoteRequest?.reference ?? booking.id}`);
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Manage booking</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Booking not found.
          </h1>
          <p className="lead">
            We could not find a booking matching that reference inside your signed-in customer account.
          </p>
          <div className="button-row" style={{ marginTop: "1.25rem" }}>
            <Link className="button button-primary" href="/account/bookings">View my bookings</Link>
            <Link className="button button-secondary" href="/support">Contact support</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
