import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Provider — Join AreaSorted",
  description:
    "Apply to join AreaSorted as a self-employed service provider in London. Structured onboarding, verified profiles, and job matching by area and availability.",
};

export default function BecomeCleanerPage() {
  return (
    <main>
      <section className="section">
        <div className="container grid-2" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow">Cleaner recruitment</div>
            <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.6rem, 4vw, 4.4rem)" }}>
              Self-employed cleaner opportunities across London, with structured onboarding.
            </h1>
            <p className="lead">
              AreaSorted reviews documents, confirms work eligibility, sends contracts via DocuSign, and then matches jobs by availability, area, and score.
            </p>
            <div className="button-row">
              <a className="button button-primary" href="/contact">Enquire About Joining</a>
              <a className="button button-secondary" href="/contact">Contact Recruitment Support</a>
            </div>
          </div>
          <div className="panel card">
            <strong>Before you apply</strong>
            <ul className="list-clean" style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
              <li>ID, CV, recent photo, and right-to-work proof are required</li>
              <li>Proof of address is recommended at onboarding</li>
              <li>DBS may be needed for some work and is paid by the cleaner</li>
              <li>Contract is issued by DocuSign after review</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-3">
          <div className="panel card"><strong>Apply</strong><p style={{ color: "var(--color-text-muted)" }}>Complete your profile and tell us your areas, availability, and work preferences.</p></div>
          <div className="panel card"><strong>Verify</strong><p style={{ color: "var(--color-text-muted)" }}>Upload documents securely for admin review and right-to-work checks.</p></div>
          <div className="panel card"><strong>Activate</strong><p style={{ color: "var(--color-text-muted)" }}>Sign the contract, set your schedule, and start receiving job offers.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <div>
            <div className="eyebrow">Why the checks matter</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Verification protects both customers and cleaners.</h2>
          </div>
          <div className="panel card">
            <ul className="list-clean" style={{ color: "var(--color-text-muted)" }}>
              <li>We ask for ID and work documents because bookings are paid and verified through the platform.</li>
              <li>Customers expect a real company with real onboarding standards.</li>
              <li>Privacy, GDPR, and legal pages are available in the footer of every page.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
