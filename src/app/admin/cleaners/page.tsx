import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listCleanerRecords } from "@/lib/cleaner-record-store";

export default async function AdminCleanersPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const cleaners = await listCleanerRecords();

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 820, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>Cleaner review list</h1>
          <p className="lead">Review cleaners, onboarding status, internal score, and customer-facing trust badges.</p>
        </div>

        <section className="panel card admin-table-shell" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead className="admin-table-head">
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.9rem 0.75rem" }}>Cleaner</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Region</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Coverage</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Onboarding</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Score</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Trust badges</th>
              </tr>
            </thead>
            <tbody>
              {cleaners.map((cleaner) => (
                <tr key={cleaner.cleanerId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.95rem 0.75rem" }}>
                    <a href={`/admin/cleaners/${cleaner.cleanerId}`} className="admin-booking-link">{cleaner.fullName}</a>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{cleaner.email}</div>
                  </td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{cleaner.region}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{cleaner.postcodeAreas.join(", ")}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{cleaner.onboardingStatus}</span></td>
                  <td style={{ padding: "0.95rem 0.75rem", fontWeight: 800 }}>{cleaner.score}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{cleaner.trustBadges.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
