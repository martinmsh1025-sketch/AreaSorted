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
            <li>Basic cleaning with customer supplies: from £48</li>
            <li>Basic cleaning with cleaner supplies: from £54</li>
            <li>Deep cleaning: from £60</li>
            <li>Final price based on property size and requirements</li>
            <li>Add-ons and surcharges shown before checkout</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
