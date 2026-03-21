import { notFound } from "next/navigation";
import { getPublicQuoteByReference } from "@/server/services/public/quote-flow";

type ManualQuoteConfirmationPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function ManualQuoteConfirmationPage({ params }: ManualQuoteConfirmationPageProps) {
  const { reference } = await params;
  const quote = await getPublicQuoteByReference(reference);
  if (!quote) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel card">
          <div className="eyebrow">Manual quote request</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Your request has been sent for manual review.
          </h1>
          <p className="lead">Quote reference: {quote.reference}</p>
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            <div><span>Provider</span><strong>Verified local provider</strong></div>
            <div><span>Service</span><strong>{quote.serviceKey.replace(/_/g, " ")}</strong></div>
            <div><span>Status</span><strong>Under review</strong></div>
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            Provider details will be shared once your booking is confirmed.
          </p>
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <a className="button button-primary" href={`/booking/status/${quote.reference}`}>View status</a>
          </div>
        </div>
      </div>
    </main>
  );
}
