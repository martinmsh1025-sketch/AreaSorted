import { notFound } from "next/navigation";
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
        include: { marketplaceProviderCompany: true, priceSnapshot: true, paymentRecords: true },
      },
    },
  });
  const booking = quote?.booking;
  if (!booking) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Booking confirmation</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Booking created</h1>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            <div><span>Booking reference</span><strong>{reference}</strong></div>
            <div><span>Assigned provider</span><strong>{booking.marketplaceProviderCompany?.tradingName || booking.marketplaceProviderCompany?.legalName}</strong></div>
            <div><span>Booking state</span><strong>{booking.bookingStatus}</strong></div>
            <div><span>Payment state</span><strong>{booking.paymentRecords[0]?.paymentState || "PENDING"}</strong></div>
            <div><span>Total</span><strong>{money(booking.priceSnapshot?.customerTotalAmount)}</strong></div>
          </div>
        </div>
      </div>
    </main>
  );
}
