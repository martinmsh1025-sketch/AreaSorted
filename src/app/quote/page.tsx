import { PublicQuoteForm } from "@/components/quote/public-quote-form";

export default function QuoteEntryPage() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <PublicQuoteForm />
      </div>
    </main>
  );
}
