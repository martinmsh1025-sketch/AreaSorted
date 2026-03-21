import { notFound } from "next/navigation";
import Link from "next/link";
import { getPrisma } from "@/lib/db";

function money(value: any) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(Number(value || 0));
}

type BookingConfirmationPageProps = { params: Promise<{ reference: string }> };

export default async function BookingConfirmationPage({ params }: BookingConfirmationPageProps) {
  const { reference } = await params;
  const prisma = getPrisma();
  const quote = await prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      booking: {
        include: {
          marketplaceProviderCompany: {
            select: { tradingName: true, legalName: true },
          },
          priceSnapshot: true,
          paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  const booking = quote?.booking;
  if (!booking) notFound();

  const providerName = booking.marketplaceProviderCompany?.tradingName
    ?? booking.marketplaceProviderCompany?.legalName
    ?? "Assigned provider";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Booking confirmation</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Thank you for your booking!
          </h1>
          <p className="lead" style={{ marginTop: "0.5rem" }}>
            Your service has been booked and payment received. Here are your booking details.
          </p>
          <div className="quote-summary-list" style={{ marginTop: "1.25rem" }}>
            <div><span>Booking reference</span><strong>{reference}</strong></div>
            <div><span>Provider</span><strong>{providerName}</strong></div>
            <div><span>Status</span><strong>{booking.bookingStatus.replace(/_/g, " ")}</strong></div>
            <div><span>Payment</span><strong>{booking.paymentRecords[0]?.paymentState?.replace(/_/g, " ") || "PENDING"}</strong></div>
            <div><span>Total</span><strong>{money(booking.priceSnapshot?.customerTotalAmount)}</strong></div>
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            Your service will be carried out by <strong>{providerName}</strong>, an independent provider arranged through AreaSorted.
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/account/bookings" className="button button-primary">
              View my bookings
            </Link>
            <Link href="/" className="button button-secondary">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
