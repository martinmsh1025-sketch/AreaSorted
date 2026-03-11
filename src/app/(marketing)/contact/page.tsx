export default function ContactPage() {
  return (
    <main className="section">
      <div className="container grid-2">
        <div>
          <div className="eyebrow">Contact us</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Speak to the team before booking or applying.</h1>
          <p className="lead">Use this page for customer support, cleaner onboarding questions, and general business enquiries.</p>
        </div>
        <div className="panel mini-form">
          <input placeholder="Your name" />
          <input placeholder="Email" />
          <textarea placeholder="How can we help?" rows={6} />
          <button type="button" className="button button-primary">Send message</button>
        </div>
      </div>
    </main>
  );
}
