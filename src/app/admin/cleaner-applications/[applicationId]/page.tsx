import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCleanerApplicationById } from "@/lib/cleaner-application-store";
import { reviewCleanerApplicationAction } from "../actions";

type AdminCleanerApplicationDetailPageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function AdminCleanerApplicationDetailPage({ params }: AdminCleanerApplicationDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { applicationId } = await params;
  const application = await getCleanerApplicationById(applicationId);
  if (!application) notFound();

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 820, marginBottom: "2rem" }}>
          <div className="eyebrow">Cleaner application review</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>{application.fullName}</h1>
          <p className="lead">Review the onboarding details, uploads, and area coverage before deciding how to proceed.</p>
        </div>

        <div className="quote-page-grid">
          <section className="quote-form-sections">
            <div className="panel card quote-section-card">
              <div className="quote-section-head"><div className="eyebrow">Identity</div><strong>Basic profile</strong></div>
              <div className="quote-summary-list">
                <div><span>Application ID</span><strong>{application.applicationId}</strong></div>
                <div><span>Email</span><strong>{application.email}</strong></div>
                <div><span>Phone</span><strong>{application.phone}</strong></div>
                <div><span>Date of birth</span><strong>{application.dateOfBirth || "-"}</strong></div>
                <div><span>Address</span><strong>{application.addressLine1}, {application.city}, {application.postcode}</strong></div>
                <div><span>Nationality</span><strong>{application.nationality || "-"}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head"><div className="eyebrow">Eligibility</div><strong>Work permission</strong></div>
              <div className="quote-summary-list">
                <div><span>Right to work</span><strong>{application.rightToWork || "-"}</strong></div>
                <div><span>Visa status</span><strong>{application.visaStatus || "-"}</strong></div>
                <div><span>Visa expiry</span><strong>{application.visaExpiry || "-"}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head"><div className="eyebrow">Matching</div><strong>Coverage and work setup</strong></div>
              <div className="quote-summary-list">
                <div><span>Region</span><strong>{application.region || "-"}</strong></div>
                <div><span>Boroughs</span><strong>{application.boroughs.join(", ") || "-"}</strong></div>
                <div><span>Postcodes</span><strong>{application.postcodeAreas.join(", ") || "-"}</strong></div>
                <div><span>Transport</span><strong>{application.transportModes.join(", ") || "-"}</strong></div>
                <div><span>Service types</span><strong>{application.serviceTypes.join(", ") || "-"}</strong></div>
                <div><span>Travel miles</span><strong>{application.maxTravelMiles || "-"}</strong></div>
                <div><span>Supplies</span><strong>{application.ownSuppliesLevel || "-"}</strong></div>
                <div><span>Tools</span><strong>{application.supplyItems.join(", ") || "-"}</strong></div>
              </div>
            </div>

            <div className="panel card quote-section-card">
              <div className="quote-section-head"><div className="eyebrow">Uploads</div><strong>Submitted files</strong></div>
              <div className="quote-summary-list">
                <div><span>ID / passport</span><strong>{application.uploads.idDocumentName || "Not uploaded"}</strong></div>
                <div><span>Photo</span><strong>{application.uploads.photoName || "Not uploaded"}</strong></div>
                <div><span>CV</span><strong>{application.uploads.cvName || "Not uploaded"}</strong></div>
                <div><span>Visa document</span><strong>{application.uploads.visaDocumentName || "Not uploaded"}</strong></div>
                <div><span>Proof of address</span><strong>{application.uploads.addressProofName || "Not uploaded"}</strong></div>
                <div><span>Intro video</span><strong>{application.uploads.introVideoName || "Not uploaded"}</strong></div>
              </div>
            </div>
          </section>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Review action</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Current status: {application.status}</h2>
              <form action={reviewCleanerApplicationAction} className="mini-form" style={{ padding: 0 }}>
                <input type="hidden" name="applicationId" value={application.applicationId} />
                <label className="quote-field-stack">
                  <span>Decision</span>
                  <select name="status" defaultValue={application.status}>
                    <option value="submitted">submitted</option>
                    <option value="under_review">under_review</option>
                    <option value="more_info_required">more_info_required</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Internal reason *</span>
                  <textarea name="internalReason" rows={4} defaultValue={application.internalReason || ""} placeholder="Internal review reason for admin / audit only" />
                </label>
                <label className="quote-field-stack">
                  <span>Applicant-facing message</span>
                  <textarea name="externalMessage" rows={3} defaultValue={application.externalMessage || ""} placeholder="Optional neutral message for applicant" />
                </label>
                <button className="button button-primary" type="submit">Save review</button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
