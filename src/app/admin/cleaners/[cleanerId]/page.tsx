import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCleanerRecordById } from "@/lib/cleaner-record-store";

type AdminCleanerDetailPageProps = {
  params: Promise<{ cleanerId: string }>;
};

export default async function AdminCleanerDetailPage({ params }: AdminCleanerDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { cleanerId } = await params;
  const cleaner = await getCleanerRecordById(cleanerId);
  if (!cleaner) notFound();

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 820, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin cleaner review</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>{cleaner.fullName}</h1>
          <p className="lead">Review core profile, area coverage, service types, score history, and trust presentation.</p>
        </div>

        <div className="quote-page-grid">
          <section className="quote-form-sections">
            <div className="panel card quote-section-card">
              <div className="quote-section-head"><div className="eyebrow">Cleaner</div><strong>Profile</strong></div>
              <div className="quote-summary-list">
                <div><span>Cleaner ID</span><strong>{cleaner.cleanerId}</strong></div>
                <div><span>Email</span><strong>{cleaner.email}</strong></div>
                <div><span>Phone</span><strong>{cleaner.phone}</strong></div>
                <div><span>Region</span><strong>{cleaner.region}</strong></div>
                <div><span>Onboarding status</span><strong>{cleaner.onboardingStatus}</strong></div>
                <div><span>Own supplies</span><strong>{cleaner.hasOwnSupplies ? "Yes" : "No"}</strong></div>
              </div>
            </div>
            <div className="panel card quote-section-card">
              <div className="quote-section-head"><div className="eyebrow">Coverage</div><strong>Service matching data</strong></div>
              <div className="quote-summary-list">
                <div><span>Boroughs</span><strong>{cleaner.boroughs.join(", ")}</strong></div>
                <div><span>Postcodes</span><strong>{cleaner.postcodeAreas.join(", ")}</strong></div>
                <div><span>Transport</span><strong>{cleaner.transportModes.join(", ")}</strong></div>
                <div><span>Service types</span><strong>{cleaner.serviceTypes.join(", ")}</strong></div>
              </div>
            </div>
          </section>
          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Internal score</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>{cleaner.score}</h2>
              <ul className="list-clean quote-meta-list">
                {cleaner.scoreLog.map((entry) => (
                  <li key={`${entry.date}-${entry.reason}`}>{entry.date}: {entry.delta > 0 ? "+" : ""}{entry.delta} {entry.reason}</li>
                ))}
              </ul>
            </section>
            <section className="panel card">
              <div className="eyebrow">Customer view</div>
              <ul className="list-clean quote-meta-list">
                {cleaner.trustBadges.map((badge) => (
                  <li key={badge}>{badge}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
