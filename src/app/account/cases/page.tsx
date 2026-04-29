import Link from "next/link";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";
import { CaseStatusBadge } from "@/components/customer/case-status-badge";
import { ComplaintTimeline } from "@/components/customer/complaint-timeline";
import { parseComplaintAttachmentPaths } from "@/lib/complaints/attachments";
import { getComplaintSlaMessage } from "@/lib/complaints/sla";

export default async function AccountCasesPage() {
  const customer = await requireCustomerSession();
  const prisma = getPrisma();

  const complaints = await prisma.complaint.findMany({
    where: { customerId: customer.id },
    include: {
      booking: {
        select: {
          id: true,
          bookingStatus: true,
          servicePostcode: true,
          scheduledDate: true,
          scheduledStartTime: true,
          quoteRequest: { select: { reference: true, serviceKey: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="account-main-column">
      <div className="panel card" style={{ marginBottom: "1.5rem" }}>
        <div className="eyebrow">Support cases</div>
        <h1 className="title" style={{ marginTop: "0.35rem", fontSize: "1.45rem" }}>My cases</h1>
        <p className="lead" style={{ fontSize: "0.95rem" }}>
          Track complaint status, review notes, evidence, and expected next steps for any booking issue you have raised with AreaSorted.
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="panel card">
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0 }}>No cases yet</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.65 }}>
            You have not raised any booking issues. If you need help with a completed or active booking, open the booking and use the case reporting form there.
          </p>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/account/bookings" className="button button-primary">View bookings</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {complaints.map((complaint) => {
            const attachments = parseComplaintAttachmentPaths(complaint.attachmentPath);
            const bookingRef = complaint.booking.quoteRequest?.reference || complaint.booking.id;
            const bookingLabel = complaint.booking.quoteRequest?.serviceKey || "Booking";

            return (
              <div key={complaint.id} className="panel card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <div className="eyebrow">{bookingLabel}</div>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0.35rem 0 0" }}>{complaint.complaintType.replace(/_/g, " ")}</h2>
                    <p style={{ margin: "0.3rem 0 0", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                      {complaint.booking.servicePostcode} · {complaint.booking.scheduledDate.toLocaleDateString("en-GB")} at {complaint.booking.scheduledStartTime}
                    </p>
                  </div>
                  <CaseStatusBadge status={complaint.status} />
                </div>

                <p style={{ margin: "0.9rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {complaint.description}
                </p>

                <div style={{ marginTop: "0.9rem", padding: "0.85rem 0.95rem", borderRadius: "0.8rem", background: "#f8fafc", border: "1px solid rgba(15,23,42,0.08)" }}>
                  <strong style={{ display: "block", fontSize: "0.88rem" }}>Expected next step</strong>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    {getComplaintSlaMessage(complaint.status, complaint.createdAt)}
                  </p>
                </div>

                {attachments.length > 0 ? (
                  <div style={{ marginTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    {attachments.map((_, index) => (
                      <a key={index} href={`/api/complaint-evidence/${complaint.id}?index=${index}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-brand)", fontWeight: 600 }}>
                        View evidence {index + 1}
                      </a>
                    ))}
                  </div>
                ) : null}

                <ComplaintTimeline
                  status={complaint.status}
                  createdAt={complaint.createdAt}
                  reviewedAt={complaint.reviewedAt}
                  resolutionNotes={complaint.resolutionNotes}
                />

                {complaint.resolutionNotes ? (
                  <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid var(--color-border)" }}>
                    <strong style={{ display: "block", fontSize: "0.9rem" }}>AreaSorted review note</strong>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {complaint.resolutionNotes}
                    </p>
                  </div>
                ) : null}

                <div className="button-row" style={{ marginTop: "1rem" }}>
                  <Link href={`/account/bookings/${bookingRef}`} className="button button-secondary">Open booking</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
