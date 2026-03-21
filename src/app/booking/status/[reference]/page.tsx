import { notFound } from "next/navigation";
import { getPublicQuoteByReference } from "@/server/services/public/quote-flow";
import { getDisplayPaymentStatus, getPaymentStatusLabel } from "@/lib/payments/display-status";

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

  // Only show provider name after payment
  const paymentStatus = getDisplayPaymentStatus({
    paymentState: quote.booking?.paymentRecords[0]?.paymentState,
    metadataJson: quote.booking?.paymentRecords[0]?.metadataJson,
    bookingStatus: quote.booking?.bookingStatus,
  });
  const isPaid = paymentStatus === "CAPTURED";
  const providerDisplay = isPaid
    ? (quote.providerCompany?.tradingName || quote.providerCompany?.legalName || "Assigned provider")
    : "Verified local provider";

  const bookingStatus = quote.booking?.bookingStatus || "Not booked yet";
  const canBookNow = !quote.booking && quote.state === "PRICED";
  const unavailable = quote.state === "EXPIRED";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card">
          <div className="eyebrow">Booking status</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{quote.reference}</h1>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            <div><span>Status</span><strong>{unavailable ? "UNAVAILABLE" : bookingStatus.replace(/_/g, " ")}</strong></div>
            <div><span>Provider</span><strong>{providerDisplay}</strong></div>
            <div><span>Service</span><strong>{quote.serviceKey.replace(/_/g, " ")}</strong></div>
            <div><span>Address</span><strong>{[quote.addressLine1, quote.addressLine2, quote.city, quote.postcode].filter(Boolean).join(", ")}</strong></div>
            <div><span>Total quoted</span><strong>{formatMoney(quote.priceSnapshot?.totalCustomerPay)}</strong></div>
            <div><span>Payment</span><strong>{getPaymentStatusLabel(paymentStatus)}</strong></div>
          </div>
          {canBookNow && (
            <div className="button-row" style={{ marginTop: "1rem" }}>
              <a className="button button-primary" href={`/quote/${quote.reference}`}>Review quote and pay</a>
            </div>
          )}
          {!isPaid && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {unavailable
                  ? "We could not prepare a quote for this request. Please contact support if you need help with a revised booking."
                  : quote.booking?.bookingStatus === "PENDING_ASSIGNMENT"
                    ? "Your temporary card hold is active. The provider has up to 24 hours to confirm before the hold is released automatically."
                    : "Provider details are shared after the booking is confirmed and payment is captured."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
