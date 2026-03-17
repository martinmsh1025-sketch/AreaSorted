import { notFound } from "next/navigation";
import { getPublicQuoteByReference } from "@/server/services/public/quote-flow";

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

type BookingStatusPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function BookingStatusPage({ params }: BookingStatusPageProps) {
  const { reference } = await params;
  const quote = await getPublicQuoteByReference(reference);
  if (!quote) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Booking status</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{quote.reference}</h1>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            <div><span>Quote state</span><strong>{quote.state}</strong></div>
            <div><span>Assigned provider</span><strong>{quote.providerCompany?.tradingName || quote.providerCompany?.legalName || "Pending"}</strong></div>
            <div><span>Service</span><strong>{quote.serviceKey}</strong></div>
            <div><span>Address</span><strong>{[quote.addressLine1, quote.addressLine2, quote.city, quote.postcode].filter(Boolean).join(", ")}</strong></div>
            <div><span>Total quoted</span><strong>{formatMoney(quote.priceSnapshot?.totalCustomerPay)}</strong></div>
            <div><span>Quote required</span><strong>{quote.quoteRequired ? "Yes" : "No"}</strong></div>
            <div><span>Booking state</span><strong>{quote.booking?.bookingStatus || "Not booked yet"}</strong></div>
            <div><span>Payment state</span><strong>{quote.booking?.paymentRecords[0]?.paymentState || "Not started"}</strong></div>
          </div>
        </div>
      </div>
    </main>
  );
}
