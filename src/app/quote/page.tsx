import { Suspense } from "react";
import { PublicQuoteForm } from "@/components/quote/public-quote-form";
import { getEnabledServiceValues } from "@/lib/service-catalog-settings";

export default async function QuoteEntryPage() {
  const enabledServiceValues = await getEnabledServiceValues();
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1400 }}>
        <Suspense fallback={<div className="panel mini-form" style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>Loading form...</div>}>
          <PublicQuoteForm enabledServiceValues={enabledServiceValues} />
        </Suspense>
      </div>
    </main>
  );
}
