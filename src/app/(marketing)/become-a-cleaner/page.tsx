import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Provider — Join AreaSorted",
  description:
    "Apply to join AreaSorted as an independent service provider in London. Structured onboarding, verified profiles, and local job opportunities across multiple service categories.",
};

export default function BecomeCleanerPage() {
  return (
    <main>
      <section className="section">
        <div className="container grid-2" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow">For providers</div>
            <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.6rem, 4vw, 4.4rem)" }}>
              Join AreaSorted as an independent local service provider.
            </h1>
            <p className="lead">
              We work with self-employed professionals across cleaning, pest control, handyman work, furniture assembly, waste removal, and garden maintenance. Every application goes through a structured onboarding and review process before work can begin.
            </p>
            <div className="button-row">
              <a className="button button-primary" href="/contact">Apply to Join</a>
              <a className="button button-secondary" href="/contact">Talk to the Team</a>
            </div>
          </div>
          <div className="panel card">
            <strong>Before you apply</strong>
            <ul className="list-clean" style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
              <li>ID and right-to-work documents are required</li>
              <li>You should have relevant experience for the services you offer</li>
              <li>Proof of address and business details may be requested</li>
              <li>Some categories may need extra checks before activation</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-3">
          <div className="panel card"><strong>Apply</strong><p style={{ color: "var(--color-text-muted)" }}>Tell us what services you provide, where you work, and what type of jobs you want to take on.</p></div>
          <div className="panel card"><strong>Verify</strong><p style={{ color: "var(--color-text-muted)" }}>Submit documents securely so we can review identity, eligibility, and service fit.</p></div>
          <div className="panel card"><strong>Get set up</strong><p style={{ color: "var(--color-text-muted)" }}>Once approved, you can complete setup and start receiving suitable local booking opportunities.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <div>
            <div className="eyebrow">Why the checks matter</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Verification helps build trust on both sides.</h2>
          </div>
          <div className="panel card">
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>Customers want to know that professionals on the platform have been properly reviewed.</li>
              <li>Good onboarding helps us keep service quality, communication, and coverage standards consistent.</li>
              <li>Clear requirements from the start help providers understand whether AreaSorted is the right fit.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
