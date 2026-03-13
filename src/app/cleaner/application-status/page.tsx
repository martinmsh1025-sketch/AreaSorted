import { redirect } from "next/navigation";
import { getAuthenticatedCleanerEmail } from "@/lib/cleaner-auth";
import { getCleanerApplicationByEmail } from "@/lib/cleaner-application-store";
import { getCleanerRecordByEmail } from "@/lib/cleaner-record-store";

export default async function CleanerApplicationStatusPage() {
  const email = await getAuthenticatedCleanerEmail();
  if (!email) redirect("/cleaner/login");

  const cleaner = await getCleanerRecordByEmail(email);
  if (cleaner) redirect("/cleaner/jobs");

  const application = await getCleanerApplicationByEmail(email);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="panel card">
          <div className="eyebrow">Cleaner application status</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Track your application before activation.</h1>
          {!application ? (
            <p className="lead">No cleaner application was found for this login yet.</p>
          ) : (
            <>
              <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
                <div><span>Application reference</span><strong>{application.applicationId}</strong></div>
                <div><span>Status</span><strong>{application.status}</strong></div>
                <div><span>Submitted</span><strong>{application.submittedAt}</strong></div>
                <div><span>Updated</span><strong>{application.updatedAt}</strong></div>
              </div>

              {application.status === "approved" ? (
                <div className="panel card" style={{ marginTop: "1rem" }}>
                  <div className="eyebrow">Approved</div>
                  <p className="lead" style={{ marginBottom: 0 }}>Your application has been approved. WashHub will finish activation and issue your cleaner ID before work begins.</p>
                </div>
              ) : null}

              {application.status === "more_info_required" ? (
                <div className="panel card" style={{ marginTop: "1rem" }}>
                  <div className="eyebrow">More info required</div>
                  <p className="lead" style={{ marginBottom: 0 }}>{application.externalMessage || "WashHub needs more information before the application can continue."}</p>
                </div>
              ) : null}

              {application.status === "rejected" ? (
                <div className="panel card" style={{ marginTop: "1rem" }}>
                  <div className="eyebrow">Application outcome</div>
                  <p className="lead" style={{ marginBottom: 0 }}>{application.externalMessage || "WashHub is unable to proceed with the application at this stage."}</p>
                </div>
              ) : null}

              {application.status === "under_review" || application.status === "submitted" ? (
                <div className="panel card" style={{ marginTop: "1rem" }}>
                  <div className="eyebrow">Review in progress</div>
                  <p className="lead" style={{ marginBottom: 0 }}>Your application is currently being reviewed by admin. Please check back later or watch for email updates.</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
