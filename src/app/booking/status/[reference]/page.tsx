import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuoteAccessGateByReference, getPublicQuoteByReference } from "@/server/services/public/quote-flow";
import { getDisplayPaymentStatus, getPaymentStatusLabel } from "@/lib/payments/display-status";
import { formatMoney } from "@/lib/format";
import { maskAddressSummary, redactReference } from "@/lib/privacy/public-display";
import { getCustomerSession } from "@/lib/customer-auth";
import { customerOwnsQuote, QUOTE_ACCESS_PARAM, verifyQuoteAccessToken } from "@/lib/quotes/access";

type BookingStatusPageProps = {
  params: Promise<{ reference: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingStatusPage({ params, searchParams }: BookingStatusPageProps) {
  const { reference } = await params;
  const query = (await searchParams) ?? {};
  const accessToken = typeof query[QUOTE_ACCESS_PARAM] === "string" ? query[QUOTE_ACCESS_PARAM] : "";
  const gate = await getQuoteAccessGateByReference(reference);
  if (!gate) notFound();

  const session = await getCustomerSession();
  const canAccessStatus = verifyQuoteAccessToken(reference, accessToken) || customerOwnsQuote(gate.customerEmail, session?.email);

  if (!canAccessStatus) {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="panel card">
            <div className="eyebrow">Booking status</div>
            <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Secure status link required.
            </h1>
            <p className="lead">
              For privacy, booking status is only shown from the secure booking link or inside the customer account.
            </p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Reference: {redactReference(reference)}
            </p>
            <div className="button-row" style={{ marginTop: "1.25rem" }}>
              <Link className="button button-primary" href={`/customer/login?redirectTo=${encodeURIComponent(`/booking/status/${reference}`)}`}>
                Log in to view status
              </Link>
              <Link className="button button-secondary" href="/support">Contact support</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{redactReference(quote.reference)}</h1>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            <div><span>Status</span><strong>{unavailable ? "UNAVAILABLE" : bookingStatus.replace(/_/g, " ")}</strong></div>
            <div><span>Provider</span><strong>{providerDisplay}</strong></div>
            <div><span>Service</span><strong>{quote.serviceKey.replace(/_/g, " ")}</strong></div>
            <div><span>Area</span><strong>{maskAddressSummary({ city: quote.city, postcode: quote.postcode })}</strong></div>
            <div><span>Total quoted</span><strong>{formatMoney(quote.priceSnapshot?.totalCustomerPay)}</strong></div>
            <div><span>Payment</span><strong>{getPaymentStatusLabel(paymentStatus)}</strong></div>
          </div>
          {!unavailable && quote.booking?.bookingStatus === "PENDING_ASSIGNMENT" && (
            <div className="panel" style={{ marginTop: "1rem", background: "var(--color-surface-muted)" }}>
              <strong style={{ display: "block", marginBottom: "0.45rem" }}>What happens next</strong>
              <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
                <li>Your booking request is waiting for provider confirmation.</li>
                <li>Your card hold remains in place while confirmation is pending.</li>
                <li>If the booking cannot be confirmed, the hold is released automatically.</li>
              </ol>
            </div>
          )}
          {canBookNow && (
            <div className="button-row" style={{ marginTop: "1rem" }}>
              <a
                className="button button-primary"
                href={`/quote/${quote.reference}${accessToken ? `?${QUOTE_ACCESS_PARAM}=${encodeURIComponent(accessToken)}` : ""}`}
              >
                Review quote and continue
              </a>
            </div>
          )}
          {!isPaid && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {unavailable
                  ? "We could not prepare a quote for this request. Please contact support if you need help with a revised booking."
                  : quote.booking?.bookingStatus === "PENDING_ASSIGNMENT"
                    ? "Your temporary card hold is active. The provider usually has up to 24 hours to confirm before the hold is released automatically."
                    : "Public status pages intentionally hide exact address details and provider identity until the booking is confirmed."}
            </p>
          )}
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <a className="button button-secondary" href="/support">Get support</a>
          </div>
        </div>
      </div>
    </main>
  );
}
