import { notFound } from "next/navigation";
import { getPublicQuoteByReference } from "@/server/services/public/quote-flow";
import { startInstantBookingAction, submitManualQuoteAction } from "./actions";

function money(value: any) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(Number(value || 0));
}

type QuoteResultPageProps = { params: Promise<{ reference: string }> };

export default async function QuoteResultPage({ params }: QuoteResultPageProps) {
  const { reference } = await params;
  const quote = await getPublicQuoteByReference(reference);
  if (!quote || !quote.priceSnapshot) notFound();

  const manual = quote.quoteRequired;

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 980 }}>
        <div className="panel card">
          <div className="eyebrow">Quote result</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{manual ? "Manual quote required" : "Your instant quote"}</h1>
          <p className="lead">Reference: {quote.reference}</p>
          <div className="quote-page-grid" style={{ marginTop: "1.5rem" }}>
            <section className="quote-form-sections">
              <div className="panel card quote-section-card">
                <div className="quote-section-head"><div className="eyebrow">Provider</div><strong>Assigned provider</strong></div>
                <div className="quote-summary-list">
                  <div><span>Provider</span><strong>{quote.providerCompany?.tradingName || quote.providerCompany?.legalName || "Pending manual review"}</strong></div>
                  <div><span>Category</span><strong>{quote.categoryKey}</strong></div>
                  <div><span>Service</span><strong>{quote.serviceKey}</strong></div>
                  <div><span>Address</span><strong>{[quote.addressLine1, quote.addressLine2, quote.city, quote.postcode].filter(Boolean).join(", ")}</strong></div>
                </div>
              </div>
            </section>
            <aside className="quote-sidebar-stack">
              <section className="panel card quote-summary-panel">
                <div className="eyebrow">Price snapshot</div>
                <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>{money(quote.priceSnapshot.totalCustomerPay)}</h2>
                <div className="quote-summary-list">
                  <div><span>Provider base price</span><strong>{money(quote.priceSnapshot.providerBasePrice)}</strong></div>
                  <div><span>Booking fee</span><strong>{money(quote.priceSnapshot.bookingFee)}</strong></div>
                  <div><span>Commission / application fee</span><strong>{money(quote.priceSnapshot.commissionAmount)}</strong></div>
                  <div><span>Postcode surcharge</span><strong>{money(quote.priceSnapshot.postcodeSurcharge)}</strong></div>
                  <div><span>Total customer pay</span><strong>{money(quote.priceSnapshot.totalCustomerPay)}</strong></div>
                  <div><span>Quote required</span><strong>{quote.priceSnapshot.quoteRequired ? "Yes" : "No"}</strong></div>
                </div>
                {manual ? (
                  <form action={submitManualQuoteAction}>
                    <input type="hidden" name="reference" value={quote.reference} />
                    <button className="button button-primary" type="submit">Submit for manual review</button>
                  </form>
                ) : (
                  <form action={startInstantBookingAction}>
                    <input type="hidden" name="reference" value={quote.reference} />
                    <button className="button button-primary" type="submit">Book and pay</button>
                  </form>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
