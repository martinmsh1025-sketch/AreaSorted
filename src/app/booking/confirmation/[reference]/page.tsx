import { notFound } from "next/navigation";
import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { getDisplayPaymentStatus, getPaymentStatusLabel } from "@/lib/payments/display-status";

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

  const paymentStatus = getDisplayPaymentStatus({
    paymentState: booking.paymentRecords[0]?.paymentState,
    metadataJson: booking.paymentRecords[0]?.metadataJson,
    bookingStatus: booking.bookingStatus,
  });
  const isCaptured = paymentStatus === "CAPTURED";
  const providerName = isCaptured
    ? (booking.marketplaceProviderCompany?.tradingName ?? booking.marketplaceProviderCompany?.legalName ?? "Assigned provider")
    : "Verified local provider";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Booking confirmation</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Thank you for your booking!
          </h1>
          <p className="lead" style={{ marginTop: "0.5rem" }}>
            Your booking request has been received. We have placed a temporary card hold and are waiting for provider confirmation.
          </p>
          <div className="panel" style={{ marginTop: "1rem", background: "var(--color-surface-muted)" }}>
            <strong style={{ display: "block", marginBottom: "0.45rem" }}>What happens next</strong>
            <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
              <li>We send your booking request for provider confirmation.</li>
              <li>Your card remains on temporary hold while confirmation is pending.</li>
              <li>Once confirmed, payment is captured and your booking status updates automatically.</li>
            </ol>
          </div>
          <div className="quote-summary-list" style={{ marginTop: "1.25rem" }}>
            <div><span>Booking reference</span><strong>{reference}</strong></div>
            <div><span>Provider</span><strong>{providerName}</strong></div>
            <div><span>Status</span><strong>{booking.bookingStatus.replace(/_/g, " ")}</strong></div>
            <div><span>Payment</span><strong>{getPaymentStatusLabel(paymentStatus)}</strong></div>
            <div><span>Total</span><strong>{money(booking.priceSnapshot?.customerTotalAmount)}</strong></div>
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            {isCaptured
              ? <>Your service will be carried out by <strong>{providerName}</strong>, an independent provider arranged through AreaSorted.</>
              : <>A verified local provider is reviewing your booking. You are only charged once the provider confirms the job. Most booking requests are reviewed within 24 hours.</>}
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href={`/booking/status/${reference}`} className="button button-primary">
              View booking status
            </Link>
            <Link href="/account/bookings" className="button button-secondary">
              Manage in my account
            </Link>
            <Link href="/support" className="button button-secondary">
              Get support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
