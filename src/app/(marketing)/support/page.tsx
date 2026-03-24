import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Customer Support",
  description:
    "Get help with bookings, payment holds, provider confirmation, rescheduling, cancellations, and account access for AreaSorted services in London.",
};

const supportTopics = [
  "Booking confirmation delays",
  "Payment holds and charged amounts",
  "Reschedule and cancellation help",
  "Provider changes or counter offers",
  "Account access and password issues",
];

export default function SupportPage() {
  return (
    <main className="section">
      <div className="container grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="eyebrow">Customer support</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Help with an existing booking or payment question.</h1>
          <p className="lead">
            Use this page if you already have a quote, booking, account, or payment-related question. For general enquiries or provider applications, use the contact page instead.
          </p>

          <div className="panel card" style={{ marginTop: "1.2rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.7rem" }}>Best ways to reach support</h2>
            <div className="quote-summary-list">
              <div><span>Email</span><strong>support@areasorted.com</strong></div>
              <div><span>Hours</span><strong>Mon-Fri, 9am-6pm</strong></div>
              <div><span>Typical response</span><strong>Within 1 business day</strong></div>
            </div>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginTop: "0.8rem" }}>
              If your question relates to a specific booking, include your booking reference, postcode, and the change you need help with so the team can respond faster.
            </p>
          </div>
        </div>

        <div className="panel mini-form">
          <strong style={{ display: "block", marginBottom: "0.8rem" }}>Support topics we can help with</strong>
          <ul className="list-clean" style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            {supportTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>

          <div className="button-row" style={{ marginTop: "1rem" }}>
            <a className="button button-primary" href="mailto:support@areasorted.com?subject=AreaSorted%20support%20request">
              Email support
            </a>
            <Link className="button button-secondary" href="/account/bookings">
              View my bookings
            </Link>
          </div>

          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginTop: "1rem" }}>
            Need general business or provider help instead? Visit <Link href="/contact" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Contact us</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
