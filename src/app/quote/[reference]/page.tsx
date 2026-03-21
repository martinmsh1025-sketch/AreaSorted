import { notFound } from "next/navigation";
import { getPublicQuoteByReference } from "@/server/services/public/quote-flow";
import { startInstantBookingAction, submitManualQuoteAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";

function money(value: any) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(Number(value || 0));
}

function mapEmbedUrl(postcode: string) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const q = encodeURIComponent(postcode + ", London, UK");
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=15`;
}

type QuoteResultPageProps = { params: Promise<{ reference: string }> };

export default async function QuoteResultPage({ params }: QuoteResultPageProps) {
  const { reference } = await params;
  const quote = await getPublicQuoteByReference(reference);
  if (!quote || !quote.priceSnapshot) notFound();

  const manual = quote.quoteRequired;
  const embedUrl = mapEmbedUrl(quote.postcode);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="panel card">
          <div className="eyebrow">Quote result</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {manual ? "Manual quote required" : "Your instant quote"}
          </h1>
          <p className="lead">Reference: {quote.reference}</p>

          <div className="quote-page-grid" style={{ marginTop: "1.5rem" }}>
            {/* Left: job details */}
            <section className="quote-form-sections">
              <div className="panel card quote-section-card">
                <div className="quote-section-head">
                  <div className="eyebrow">Service details</div>
                  <strong>Your request</strong>
                </div>
                <div className="quote-summary-list">
                  <div><span>Service</span><strong>{quote.serviceKey.replace(/_/g, " ")}</strong></div>
                  <div><span>Category</span><strong>{quote.categoryKey.replace(/_/g, " ")}</strong></div>
                  <div><span>Address</span><strong>{[quote.addressLine1, quote.addressLine2, quote.city, quote.postcode].filter(Boolean).join(", ")}</strong></div>
                  <div><span>Provider</span><strong>Verified local provider</strong></div>
                </div>
                <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  Your service will be carried out by an independent, vetted provider in your area. Provider details will be shared after booking is confirmed.
                </p>
              </div>
            </section>

            {/* Right sidebar: price + action + map */}
            <aside className="quote-sidebar-stack">
              <section className="panel card quote-summary-panel">
                <div className="eyebrow">Price snapshot</div>
                <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>
                  {money(quote.priceSnapshot.totalCustomerPay)}
                </h2>
                <div className="quote-summary-list">
                  <div><span>Service price</span><strong>{money(quote.priceSnapshot.providerBasePrice)}</strong></div>
                  <div><span>Booking fee</span><strong>{money(quote.priceSnapshot.bookingFee)}</strong></div>
                  <div><span>Service fee</span><strong>{money(quote.priceSnapshot.commissionAmount)}</strong></div>
                  {Number(quote.priceSnapshot.postcodeSurcharge) > 0 && (
                    <div><span>Area surcharge</span><strong>{money(quote.priceSnapshot.postcodeSurcharge)}</strong></div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                    <span>Total</span><strong>{money(quote.priceSnapshot.totalCustomerPay)}</strong>
                  </div>
                </div>
                {manual ? (
                  <form action={submitManualQuoteAction} style={{ marginTop: "1rem" }}>
                    <input type="hidden" name="reference" value={quote.reference} />
                    <FormSubmitButton
                      label="Submit for manual review"
                      pendingLabel="Submitting..."
                      className="button button-primary"
                    />
                  </form>
                ) : (
                  <form action={startInstantBookingAction} style={{ marginTop: "1rem" }}>
                    <input type="hidden" name="reference" value={quote.reference} />
                    <FormSubmitButton
                      label="Book and pay"
                      pendingLabel="Processing..."
                      className="button button-primary"
                    />
                  </form>
                )}
                <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  All prices include platform fees. Service provided by an independent local provider arranged through AreaSorted.
                </p>
              </section>

              {embedUrl && (
                <section className="panel card quote-map-panel">
                  <div className="quote-map-head">
                    <div>
                      <div className="eyebrow">Service area</div>
                      <strong style={{ display: "block", marginTop: "0.3rem" }}>{quote.postcode}</strong>
                    </div>
                    <span className="quote-map-badge">Covered</span>
                  </div>
                  <div className="quote-map-frame">
                    <iframe
                      className="quote-map-iframe"
                      src={embedUrl}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Service location map"
                    />
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
