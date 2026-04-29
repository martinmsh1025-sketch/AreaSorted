import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Customer Protection",
  description: "How AreaSorted protects customers with stronger provider standards, evidence-led complaint handling, and clearer support when a booking goes wrong.",
};

const protections = [
  {
    title: "Provider standards before booking",
    copy: "We aim to give customers more than a star rating alone. Our direction is stronger onboarding, clearer provider context, insurance checks, DBS status where relevant, and more meaningful profile quality signals.",
  },
  {
    title: "A documented route if something goes wrong",
    copy: "If the provider is late, misses agreed tasks, does not show up, or there is a quality or damage issue, you can log the case through your account and keep the evidence attached to the booking.",
  },
  {
    title: "A fair review process",
    copy: "AreaSorted reviews booking notes, evidence, and provider responses before deciding whether rework, refund handling, or another outcome is appropriate.",
  },
];

const process = [
  {
    title: "1. Report the issue",
    copy: "Open the booking in your account, describe what happened, and upload photos or PDFs if needed.",
  },
  {
    title: "2. We review the case",
    copy: "The case is logged, assessed against the booking record, and reviewed with any provider response or payout hold where needed.",
  },
  {
    title: "3. You get an outcome",
    copy: "You can track the case status in your account and review any AreaSorted notes, timeline updates, and next-step guidance.",
  },
];

export default function CustomerProtectionPage() {
  return (
    <main>
      <section className="section">
        <div className="container grid-2 marketing-hero-grid" style={{ maxWidth: 1100, alignItems: "center" }}>
          <div>
            <div className="eyebrow">Customer protection</div>
            <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
              Booking support that continues after the job starts.
            </h1>
            <p className="lead" style={{ maxWidth: 760 }}>
              AreaSorted is designed to reduce guesswork before booking and create a clearer support path if a service needs review later. We want customers to understand provider standards up front and have a proper case trail if something goes wrong.
            </p>
          </div>
          <div className="marketing-mosaic-grid marketing-mosaic-grid-protection">
            <div className="marketing-crop-frame marketing-crop-frame-protection-large">
              <Image src="/images/derived-board-tight/trust-find-pros.png" alt="Find trusted professionals" fill className="marketing-crop-image" sizes="(max-width: 720px) 100vw, 33vw" />
            </div>
            <div className="marketing-crop-frame marketing-crop-frame-protection-small">
              <Image src="/images/derived-board-tight/trust-book-minutes.png" alt="Book in minutes" fill className="marketing-crop-image" sizes="(max-width: 720px) 100vw, 25vw" />
            </div>
            <div className="marketing-crop-frame marketing-crop-frame-protection-small">
              <Image src="/images/derived-board-tight/trust-secure-payments.png" alt="Secure payments" fill className="marketing-crop-image" sizes="(max-width: 720px) 100vw, 25vw" />
            </div>
            <div className="marketing-crop-frame marketing-crop-frame-protection-wide">
              <Image src="/images/derived-board-tight/trust-quality-time.png" alt="Quality service every time" fill className="marketing-crop-image" sizes="(max-width: 720px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container section-card-grid">
          {protections.map((item) => (
            <article key={item.title} className="panel card span-4 homepage-info-card">
              <div className="eyebrow">Protection</div>
              <strong style={{ marginTop: "0.5rem", display: "block" }}>{item.title}</strong>
              <p className="lead" style={{ fontSize: "0.98rem", margin: "0.55rem 0 0" }}>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">How complaints work</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>A simple, evidence-led support flow.</h2>
            <p className="lead" style={{ fontSize: "1rem" }}>
              For standard service quality issues, customers should normally raise a complaint within 48 hours of completion. After that, the booking is generally treated as accepted for standard quality purposes, subject to fraud, chargebacks, damage, and other serious matters.
            </p>
          </div>
          <div className="panel card" style={{ display: "grid", gap: "0.9rem" }}>
            {process.map((item, index) => (
              <div key={item.title} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "0.9rem", alignItems: "start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(217,37,42,0.08)", color: "var(--color-brand)", fontWeight: 800 }}>
                  {index + 1}
                </div>
                <div>
                  <strong style={{ display: "block" }}>{item.title}</strong>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.65 }}>{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">What you can track</div>
            <h2 className="title" style={{ marginTop: "0.6rem", fontSize: "1.5rem" }}>Inside your account</h2>
            <ul className="list-clean" style={{ color: "var(--color-text-muted)", marginTop: "0.8rem" }}>
              <li>Complaint status and case history</li>
              <li>Evidence uploads linked to the booking</li>
              <li>Expected next-step guidance</li>
              <li>AreaSorted review notes where available</li>
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Useful links</div>
            <h2 className="title" style={{ marginTop: "0.6rem", fontSize: "1.5rem" }}>Need more detail?</h2>
            <div className="button-row" style={{ marginTop: "1rem" }}>
              <Link href="/dispute-policy" className="button button-primary">Dispute &amp; payout policy</Link>
              <Link href="/refund-policy" className="button button-secondary">Refund policy</Link>
              <Link href="/support" className="button button-secondary">Support</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
