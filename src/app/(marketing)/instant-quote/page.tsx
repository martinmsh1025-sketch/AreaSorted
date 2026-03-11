export default function InstantQuotePage() {
  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: "2rem" }}>
          <div className="eyebrow">Instant quote</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.2rem, 4vw, 4rem)" }}>Get your cleaning quote in minutes.</h1>
          <p className="lead">Transparent pricing, verified cleaners, secure booking, and support if plans change.</p>
        </div>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <form className="panel mini-form">
            <strong>Address</strong>
            <input placeholder="Postcode" />
            <input placeholder="Address line 1" />
            <input placeholder="City" />
            <strong style={{ marginTop: "0.8rem" }}>Property details</strong>
            <select defaultValue="">
              <option value="" disabled>Property type</option>
              <option>Flat</option>
              <option>House</option>
              <option>Office</option>
            </select>
            <input placeholder="Bedrooms" />
            <input placeholder="Bathrooms" />
            <input placeholder="Estimated hours" />
            <strong style={{ marginTop: "0.8rem" }}>Service</strong>
            <select defaultValue="">
              <option value="" disabled>Service type</option>
              <option>Regular Cleaning</option>
              <option>Deep Cleaning</option>
              <option>Office Cleaning</option>
            </select>
            <select defaultValue="">
              <option value="" disabled>Who provides supplies?</option>
              <option>Customer provides supplies</option>
              <option>Cleaner brings supplies</option>
            </select>
            <textarea placeholder="Additional requests" rows={4} />
            <button className="button button-primary" type="button">Continue to Booking</button>
          </form>
          <aside className="panel card">
            <div className="eyebrow">Quote summary</div>
            <h2 className="title" style={{ marginTop: "0.6rem", fontSize: "2rem" }}>Estimated total</h2>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-display)", margin: "1rem 0" }}>GBP 96.00</div>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>Base service amount</li>
              <li>Add-ons and surcharges shown before checkout</li>
              <li>Secure payment with Stripe</li>
              <li>One reschedule allowed if more than 48 hours before start</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
