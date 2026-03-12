export default function PaymentCancelPage() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel card">
          <div className="eyebrow">Payment cancelled</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Payment was not completed.
          </h1>
          <p className="lead">
            No problem. The quote details are still in the flow, so the customer can return and try payment again.
          </p>
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <a className="button button-primary" href="/payment">Try payment again</a>
            <a className="button button-secondary" href="/book">Back to booking review</a>
          </div>
        </div>
      </div>
    </main>
  );
}
