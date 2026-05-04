import type { Metadata } from "next";
import Image from "next/image";
import { Headphones, MapPin, Rocket, ShieldCheck, ClipboardList, BadgeCheck, House } from "lucide-react";

export const metadata: Metadata = {
  title: "Become a Provider — Join AreaSorted",
  description:
    "Apply to join AreaSorted as an independent service provider in London. Structured onboarding, verified profiles, and local job opportunities across multiple service categories.",
};

export default function BecomeCleanerPage() {
  return (
    <main>
      <section className="section">
        <div className="container provider-hero-layout" style={{ alignItems: "center" }}>
          <div className="provider-hero-copy">
            <div className="eyebrow">For providers</div>
            <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.6rem, 4vw, 4.4rem)" }}>
              Join AreaSorted as an independent local service provider.
            </h1>
            <p className="lead provider-lead-tight">
              Join AreaSorted to offer cleaning, pest control, handyman work, furniture assembly, waste removal, and garden maintenance across London.
            </p>
            <p className="lead provider-sublead">
              We review providers carefully, help you set coverage and standards clearly, and support a cleaner path from onboarding to local work opportunities.
            </p>
            <div className="button-row provider-hero-actions">
              <a className="button button-primary" href="/provider/apply">Apply to Join</a>
              <a className="button button-secondary" href="/contact">Talk to the Team</a>
            </div>
            <p className="provider-hero-footnote">Free entry route available for approved providers.</p>
          </div>
          <div className="provider-hero-visual">
            <div className="provider-hero-board provider-hero-board-main">
              <Image
                src="/images/provider-generated/provider-hero-clean.png"
                alt="AreaSorted home services marketplace"
                fill
                className="marketing-crop-image"
                sizes="(max-width: 720px) 100vw, 42vw"
              />
            </div>
            <div className="provider-hero-signal-row">
              <div className="provider-hero-signal">
                <span className="provider-hero-signal-icon-wrap">
                  <ShieldCheck className="provider-hero-signal-icon" />
                </span>
                <span>Reviewed standards</span>
              </div>
              <div className="provider-hero-signal">
                <span className="provider-hero-signal-icon-wrap">
                  <Headphones className="provider-hero-signal-icon" />
                </span>
                <span>Provider support</span>
              </div>
              <div className="provider-hero-signal">
                <span className="provider-hero-signal-icon-wrap">
                  <MapPin className="provider-hero-signal-icon" />
                </span>
                <span>Local visibility</span>
              </div>
            </div>
            <div className="provider-hero-note panel card">
              <div className="eyebrow">Platform fit</div>
              <div className="provider-fit-grid">
                <div className="provider-fit-item">
                  <span className="provider-fit-icon"><ShieldCheck size={18} /></span>
                  <div>
                    <strong>Reviewed standards</strong>
                    <p>Profiles are reviewed before going live.</p>
                  </div>
                </div>
                <div className="provider-fit-item">
                  <span className="provider-fit-icon"><MapPin size={18} /></span>
                  <div>
                    <strong>Local visibility</strong>
                    <p>Show up in the areas that match your coverage.</p>
                  </div>
                </div>
                <div className="provider-fit-item">
                  <span className="provider-fit-icon"><Headphones size={18} /></span>
                  <div>
                    <strong>Provider support</strong>
                    <p>Use a clearer route from onboarding to opportunities.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="panel card provider-apply-checklist">
            <strong className="provider-section-title">Before you apply</strong>
            <ul className="list-clean" style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
              <li>ID and core eligibility documents are required</li>
              <li>You should have relevant experience for the services you offer</li>
              <li>Sole traders and limited companies will see different document requirements during onboarding</li>
              <li>Some categories may need extra checks before activation</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container provider-plans-layout">
          <div className="provider-plans-copy">
            <div className="eyebrow">Provider plans</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Choose the plan that fits your goals.</h2>
            <p className="lead provider-sublead" style={{ marginTop: "0.8rem" }}>
              Start free, or choose a growth plan if you want more visibility, managed promotion, and stronger lead support.
            </p>
          </div>
          <div className="grid-2" style={{ alignItems: "stretch" }}>
            <div className="panel card">
              <div className="provider-plan-topline">
                <span className="provider-plan-icon"><ShieldCheck size={22} /></span>
                <div>
                  <div className="eyebrow">Starter</div>
                  <h3 style={{ fontSize: "1.5rem", margin: "0.45rem 0 0" }}>&pound;0 / month</h3>
                </div>
              </div>
              <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginTop: "0.75rem" }}>
                For providers who want to join the platform, complete onboarding, and receive standard AreaSorted matching without a monthly marketing spend.
              </p>
              <ul className="list-clean" style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
                <li>Structured onboarding and verification</li>
                <li>Portal access, coverage setup, and job notifications</li>
                <li>Standard booking opportunities based on fit and availability</li>
                <li>No activation fee for approved founding providers during the launch window</li>
              </ul>
            </div>
            <div className="panel card" style={{ border: "1px solid rgba(217,37,42,0.18)", background: "linear-gradient(135deg, #fff7f7 0%, #fff 100%)" }}>
              <div className="provider-plan-topline provider-plan-topline-growth">
                <span className="provider-plan-icon provider-plan-icon-growth"><Rocket size={22} /></span>
                <div>
                  <div className="eyebrow">Growth</div>
                  <h3 style={{ fontSize: "1.5rem", margin: "0.45rem 0 0" }}>&pound;500 / month</h3>
                </div>
                <span className="provider-plan-badge">Most popular</span>
              </div>
              <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginTop: "0.75rem" }}>
                For providers who want stronger visibility and a more active acquisition push. We use this budget to support local promotion, featured exposure, and managed lead generation activity.
              </p>
              <ul className="list-clean" style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
                <li>Priority placement in selected categories or areas</li>
                <li>Managed promotion using the provider&apos;s own monthly budget</li>
                <li>Lead-generation support across channels such as SEO and paid social</li>
                <li>Targeted qualified lead volume, depending on category, location, pricing, and responsiveness</li>
              </ul>
            </div>
          </div>
          <div className="provider-plans-footnote panel card" style={{ marginTop: "1rem" }}>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, margin: 0 }}>
            Qualified leads are not the same as guaranteed bookings. Lead volume depends on service category, local demand, provider responsiveness, pricing competitiveness, and seasonal conditions.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, margin: "0.5rem 0 0" }}>
              Founding provider terms may include waived activation or plan fees for a limited launch period. Availability, category coverage, and timing are decided by AreaSorted at its discretion.
            </p>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container provider-steps-layout">
          <div className="provider-steps-copy">
            <div className="eyebrow">How it works</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Three simple steps to get started.</h2>
            <p className="lead provider-sublead" style={{ marginTop: "0.8rem" }}>
              A simple onboarding path before you start receiving opportunities.
            </p>
          </div>
          <div className="provider-steps-row">
            <div className="panel card provider-step-card-clean">
              <span className="provider-step-number">1</span>
              <span className="provider-step-icon"><ClipboardList size={34} /></span>
              <strong>Apply</strong>
              <p style={{ color: "var(--color-text-muted)" }}>Tell us about your services, where you work, and the types of jobs you want to take on.</p>
            </div>
            <div className="provider-step-arrow" aria-hidden="true">→</div>
            <div className="panel card provider-step-card-clean">
              <span className="provider-step-number">2</span>
              <span className="provider-step-icon"><BadgeCheck size={34} /></span>
              <strong>Verify</strong>
              <p style={{ color: "var(--color-text-muted)" }}>Submit your documents so we can review identity, standards, and service fit.</p>
            </div>
            <div className="provider-step-arrow" aria-hidden="true">→</div>
            <div className="panel card provider-step-card-clean">
              <span className="provider-step-number">3</span>
              <span className="provider-step-icon"><House size={34} /></span>
              <strong>Get set up</strong>
              <p style={{ color: "var(--color-text-muted)" }}>Once approved, complete your profile and start receiving suitable local booking opportunities.</p>
            </div>
          </div>
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
              <li>Stronger standards make it easier to support better-quality leads and more confident customers.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
