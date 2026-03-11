export default function PricingPage() {
  return (
    <main className="section">
      <div className="container grid-2">
        <div>
          <div className="eyebrow">Pricing</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Transparent pricing for London cleaning bookings.</h1>
        </div>
        <div className="panel card">
          <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
            <li>Basic cleaning with customer supplies: from GBP 24/hour</li>
            <li>Basic cleaning with cleaner supplies: from GBP 27/hour</li>
            <li>Deep cleaning: from GBP 30/hour</li>
            <li>Add-ons and surcharges shown before checkout</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
