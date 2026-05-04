import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuoteAccessGateByReference, getPublicQuoteByReference } from "@/server/services/public/quote-flow";
import { startInstantBookingAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { ProviderOptionSelector } from "@/components/quote/provider-option-selector";
import { maskAddressSummary, redactReference } from "@/lib/privacy/public-display";
import { parseProviderPublicProfileMetadata } from "@/lib/providers/public-profile-metadata";
import { getCustomerSession } from "@/lib/customer-auth";
import { customerOwnsQuote, QUOTE_ACCESS_PARAM, verifyQuoteAccessToken } from "@/lib/quotes/access";

function money(value: any) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(Number(value || 0));
}

type QuoteResultPageProps = { params: Promise<{ reference: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function QuoteResultPage({ params, searchParams }: QuoteResultPageProps) {
  const { reference } = await params;
  const query = (await searchParams) ?? {};
  const accessToken = typeof query[QUOTE_ACCESS_PARAM] === "string" ? query[QUOTE_ACCESS_PARAM] : "";
  const gate = await getQuoteAccessGateByReference(reference);
  if (!gate) notFound();

  const session = await getCustomerSession();
  const canAccessQuote = verifyQuoteAccessToken(reference, accessToken) || customerOwnsQuote(gate.customerEmail, session?.email);

  if (!canAccessQuote) {
    const loginRedirect = `/quote/${encodeURIComponent(reference)}`;
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="panel card">
            <div className="eyebrow">Quote access</div>
            <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Secure quote link required.
            </h1>
            <p className="lead">
              For privacy, quote details are only shown from the secure quote link or inside the customer account that created the quote.
            </p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Reference: {redactReference(reference)}
            </p>
            <div className="button-row" style={{ marginTop: "1.25rem" }}>
              <Link className="button button-primary" href={`/customer/login?redirectTo=${encodeURIComponent(loginRedirect)}`}>
                Log in to view quote
              </Link>
              <Link className="button button-secondary" href="/support">Contact support</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const quote = await getPublicQuoteByReference(reference);
  if (!quote || !quote.priceSnapshot) notFound();

  const unavailable = quote.state === "EXPIRED";
  const requestedOptionId = typeof query.selectedQuoteOptionId === "string" ? query.selectedQuoteOptionId : quote.selectedQuoteOptionId;
  const selectedOption = quote.quoteOptions.find((option) => option.id === requestedOptionId) || quote.quoteOptions.find((option) => option.id === quote.selectedQuoteOptionId) || quote.quoteOptions[0] || null;
  const recommendedOptionId = quote.quoteOptions[0]?.id;

  const providerOptions = quote.quoteOptions.map((option) => {
    const approvedDocKeys = new Set(option.providerCompany?.documents.map((document) => document.documentKey) || []);
    const publicProfileMetadata = parseProviderPublicProfileMetadata(option.providerCompany?.specialtiesText);
    return {
      id: option.id,
      providerName: option.providerName || option.providerCompany?.tradingName || option.providerCompany?.legalName || "Verified local provider",
      profileImageUrl: option.providerCompany?.profileImageUrl,
      headline: option.providerCompany?.headline,
      bio: option.providerCompany?.bio,
      yearsExperience: option.providerCompany?.yearsExperience,
      supportedContactChannels: publicProfileMetadata.supportedContactChannels,
      responseTimeLabel: publicProfileMetadata.responseTimeLabel,
      serviceCommitments: publicProfileMetadata.serviceCommitments,
      languagesSpoken: publicProfileMetadata.languagesSpoken,
      totalCustomerPay: Number(option.totalCustomerPay),
      providerBasePrice: Number(option.providerBasePrice),
      bookingFee: Number(option.bookingFee),
      postcodeSurcharge: Number(option.postcodeSurcharge),
      hasDbs: approvedDocKeys.has("dbs_certificate"),
      hasInsurance: approvedDocKeys.has("insurance_proof"),
      recommended: option.id === recommendedOptionId,
      selected: option.id === selectedOption?.id,
    };
  });

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="panel card">
          <div className="eyebrow">Quote result</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {unavailable ? "Quote unavailable" : "Your booking price"}
          </h1>
          <p className="lead">Reference: {redactReference(quote.reference)}</p>

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
                  <div><span>Area</span><strong>{maskAddressSummary({ city: quote.city, postcode: quote.postcode })}</strong></div>
                  <div><span>Provider</span><strong>Compare verified provider profiles before payment</strong></div>
                </div>
                <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  Your service will be carried out by an independent, vetted provider in your area. We show profile details and supported contact methods here, but direct contact details stay hidden until booking and payment are secured.
                </p>
              </div>
            </section>

            {/* Right sidebar: price + action + map */}
            <aside className="quote-sidebar-stack">
              <section className="panel card quote-summary-panel">
                <div className="eyebrow">Price snapshot</div>
                <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>
                  {money(selectedOption?.totalCustomerPay ?? quote.priceSnapshot.totalCustomerPay)}
                </h2>
                <div className="quote-summary-list">
                  <div><span>Service price</span><strong>{money(selectedOption?.providerBasePrice ?? quote.priceSnapshot.providerBasePrice)}</strong></div>
                  <div><span>Booking fee</span><strong>{money(selectedOption?.bookingFee ?? quote.priceSnapshot.bookingFee)}</strong></div>
                  {Number(selectedOption?.postcodeSurcharge ?? quote.priceSnapshot.postcodeSurcharge) > 0 && (
                    <div><span>Area surcharge</span><strong>{money(selectedOption?.postcodeSurcharge ?? quote.priceSnapshot.postcodeSurcharge)}</strong></div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                    <span>Total</span><strong>{money(selectedOption?.totalCustomerPay ?? quote.priceSnapshot.totalCustomerPay)}</strong>
                  </div>
                </div>
                {unavailable ? (
                  <div style={{ marginTop: "1rem" }}>
                    <div className="muted-block">
                      We could not prepare a quote for this request. Please submit a new request or contact support if you need help.
                    </div>
                  </div>
                ) : (
                  <form action={startInstantBookingAction} style={{ marginTop: "1rem" }}>
                    <input type="hidden" name="reference" value={quote.reference} />
                    {accessToken ? <input type="hidden" name={QUOTE_ACCESS_PARAM} value={accessToken} /> : null}
                    {selectedOption ? <input type="hidden" name="selectedQuoteOptionId" value={selectedOption.id} /> : null}
                    <FormSubmitButton
                      label="Continue to secure hold"
                      pendingLabel="Processing..."
                      className="button button-primary"
                    />
                  </form>
                )}
                <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  All prices include platform fees. Next, we place a temporary card hold to secure your booking request. You are only charged once the matched provider confirms the job.
                </p>
                {!unavailable && (
                  <p style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    After you continue, you will see a booking confirmation page with the next steps and your current status.
                  </p>
                )}
              </section>

              {providerOptions.length > 0 && !unavailable ? <ProviderOptionSelector quoteReference={quote.reference} accessToken={accessToken} options={providerOptions} /> : null}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
