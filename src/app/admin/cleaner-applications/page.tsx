import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listCleanerApplications } from "@/lib/cleaner-application-store";

export default async function AdminCleanerApplicationsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const applications = await listCleanerApplications();

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 820, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>Cleaner applications</h1>
          <p className="lead">Review submitted onboarding forms, then approve, reject, or request more information.</p>
        </div>

        <section className="panel card admin-table-shell" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead className="admin-table-head">
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.9rem 0.75rem" }}>Application</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Cleaner</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Region</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Coverage</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Status</th>
                <th style={{ padding: "0.9rem 0.75rem" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.length ? applications.map((application) => (
                <tr key={application.applicationId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.95rem 0.75rem", fontWeight: 700 }}>
                    <a href={`/admin/cleaner-applications/${application.applicationId}`} className="admin-booking-link">{application.applicationId}</a>
                  </td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>
                    <div>{application.fullName}</div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{application.email}</div>
                  </td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{application.region || "-"}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}>{application.postcodeAreas.join(", ") || "-"}</td>
                  <td style={{ padding: "0.95rem 0.75rem" }}><span className="admin-status-pill">{application.status}</span></td>
                  <td style={{ padding: "0.95rem 0.75rem", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{application.submittedAt}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: "1.25rem 0.75rem", color: "var(--color-text-muted)" }}>No cleaner applications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
