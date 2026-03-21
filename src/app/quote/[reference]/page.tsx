import { notFound } from "next/navigation";
import { getPublicQuoteByReference } from "@/server/services/public/quote-flow";
import { selectQuoteOptionAction, startInstantBookingAction, submitManualQuoteAction } from "./actions";
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
  if (!quote) notFound();

  const hasMultipleOptions = quote.quoteOptions.length > 1;
  const providerSelected = Boolean(quote.providerCompanyId && quote.priceSnapshot);
  const showComparison = hasMultipleOptions && !providerSelected;
  const embedUrl = mapEmbedUrl(quote.postcode);

  // ── Comparison view: customer picks from multiple providers ──
  if (showComparison) {
    const prices = quote.quoteOptions.map((o) => Number(o.totalCustomerPay));
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);

    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 1400 }}>
          <div className="panel card">
            <div className="eyebrow">Quote result</div>
            <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Choose your provider
            </h1>
            <p className="lead">
              Reference: {quote.reference} &middot; {quote.quoteOptions.length} providers available
            </p>

            <div className="quote-page-grid" style={{ marginTop: "1.5rem" }}>
              {/* Left: provider cards */}
              <section className="quote-form-sections">
                {/* Job summary card */}
                <div className="panel card quote-section-card">
                  <div className="quote-section-head">
                    <div className="eyebrow">Job details</div>
                    <strong>Your request</strong>
                  </div>
                  <div className="quote-summary-list">
                    <div><span>Service</span><strong>{quote.serviceKey.replace(/_/g, " ")}</strong></div>
                    <div><span>Category</span><strong>{quote.categoryKey.replace(/_/g, " ")}</strong></div>
                    <div><span>Location</span><strong>{quote.postcode}</strong></div>
                    <div><span>Address</span><strong>{[quote.addressLine1, quote.city].filter(Boolean).join(", ")}</strong></div>
                  </div>
                </div>

                {/* Provider option cards */}
                <div className="panel card quote-section-card">
                  <div className="quote-section-head">
                    <div className="eyebrow">Available providers</div>
                    <strong>Select a provider to continue</strong>
                  </div>

                  <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
                    {quote.quoteOptions.map((option, index) => {
                      const isBestPrice = Number(option.totalCustomerPay) === lowest;
                      return (
                        <div
                          key={option.id}
                          className="panel card"
                          style={{
                            border: isBestPrice ? "2px solid var(--color-brand)" : undefined,
                            position: "relative",
                          }}
                        >
                          {isBestPrice && (
                            <span className="quote-map-badge" style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                              Best price
                            </span>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                                {option.providerName || `Provider ${index + 1}`}
                              </div>
                              <div className="quote-summary-list" style={{ marginTop: "0.6rem", fontSize: "0.88rem" }}>
                                <div><span>Base price</span><strong>{money(option.providerBasePrice)}</strong></div>
                                <div><span>Booking fee</span><strong>{money(option.bookingFee)}</strong></div>
                                {Number(option.postcodeSurcharge) > 0 && (
                                  <div><span>Area surcharge</span><strong>{money(option.postcodeSurcharge)}</strong></div>
                                )}

                              </div>
                              {!option.paymentReady && (
                                <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--color-warning, #d97706)", lineHeight: 1.5 }}>
                                  This provider requires manual review before booking.
                                </p>
                              )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                              <div style={{ textAlign: "right" }}>
                                <div className="quote-total-number" style={{ fontSize: "1.6rem", margin: 0 }}>
                                  {money(option.totalCustomerPay)}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>total inc. fees</div>
                              </div>
                              <form action={selectQuoteOptionAction}>
                                <input type="hidden" name="reference" value={quote.reference} />
                                <input type="hidden" name="quoteOptionId" value={option.id} />
                                <FormSubmitButton
                                  label={isBestPrice ? "Select best price" : "Select"}
                                  pendingLabel="Selecting..."
                                  className={`button ${isBestPrice ? "button-primary" : "button-secondary"}`}
                                />
                              </form>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Right sidebar: estimated pricing summary + map */}
              <aside className="quote-sidebar-stack">
                <section className="panel card quote-summary-panel">
                  <div className="eyebrow">Estimated pricing</div>
                  <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>
                    {lowest === highest ? money(lowest) : `${money(lowest)} – ${money(highest)}`}
                  </h2>
                  <div className="quote-summary-list" style={{ marginTop: "0.8rem" }}>
                    <div><span>Providers available</span><strong>{quote.quoteOptions.length}</strong></div>
                    <div><span>Service</span><strong>{quote.serviceKey.replace(/_/g, " ")}</strong></div>
                    <div><span>Location</span><strong>{quote.postcode}</strong></div>
                    <div><span>Lowest price</span><strong>{money(lowest)}</strong></div>
                    {lowest !== highest && <div><span>Highest price</span><strong>{money(highest)}</strong></div>}
                  </div>
                  <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    All prices include a platform booking fee and service commission. Select a provider on the left to proceed.
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

  // ── Single provider view (or provider already selected) ──
  if (!quote.priceSnapshot) notFound();

  const manual = quote.quoteRequired;

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
                  <div className="eyebrow">Provider</div>
                  <strong>Assigned provider</strong>
                </div>
                <div className="quote-summary-list">
                  <div><span>Provider</span><strong>{quote.providerCompany?.tradingName || quote.providerCompany?.legalName || "Pending manual review"}</strong></div>
                  <div><span>Category</span><strong>{quote.categoryKey.replace(/_/g, " ")}</strong></div>
                  <div><span>Service</span><strong>{quote.serviceKey.replace(/_/g, " ")}</strong></div>
                  <div><span>Address</span><strong>{[quote.addressLine1, quote.addressLine2, quote.city, quote.postcode].filter(Boolean).join(", ")}</strong></div>
                </div>
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
                  <div><span>Provider base price</span><strong>{money(quote.priceSnapshot.providerBasePrice)}</strong></div>
                  <div><span>Booking fee</span><strong>{money(quote.priceSnapshot.bookingFee)}</strong></div>
                  <div><span>Commission / application fee</span><strong>{money(quote.priceSnapshot.commissionAmount)}</strong></div>
                  {Number(quote.priceSnapshot.postcodeSurcharge) > 0 && (
                    <div><span>Postcode surcharge</span><strong>{money(quote.priceSnapshot.postcodeSurcharge)}</strong></div>
                  )}
                  <div><span>Total customer pay</span><strong>{money(quote.priceSnapshot.totalCustomerPay)}</strong></div>
                  <div><span>Quote required</span><strong>{quote.priceSnapshot.quoteRequired ? "Yes" : "No"}</strong></div>
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
