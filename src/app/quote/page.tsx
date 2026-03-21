import { Suspense } from "react";
import { PublicQuoteForm } from "@/components/quote/public-quote-form";

export default function QuoteEntryPage() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1400 }}>
        <Suspense fallback={<div className="panel mini-form" style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>Loading form...</div>}>
          <PublicQuoteForm />
        </Suspense>
      </div>
    </main>
  );
}
