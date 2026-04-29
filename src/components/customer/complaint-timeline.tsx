import { getComplaintTimeline } from "@/lib/complaints/timeline";
import type { ComplaintStatus } from "@prisma/client";

export function ComplaintTimeline({
  status,
  createdAt,
  reviewedAt,
  resolutionNotes,
}: {
  status: ComplaintStatus;
  createdAt: Date;
  reviewedAt?: Date | null;
  resolutionNotes?: string | null;
}) {
  const items = getComplaintTimeline({ status, createdAt, reviewedAt, resolutionNotes });

  return (
    <div style={{ marginTop: "0.85rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.85rem" }}>
      <strong style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.7rem" }}>Case timeline</strong>
      <div style={{ display: "grid", gap: "0.7rem" }}>
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: "0.7rem", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "0.2rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--color-brand)" }} />
              {index < items.length - 1 ? <span style={{ width: 1, flex: 1, minHeight: 22, background: "var(--color-border)", marginTop: 4 }} /> : null}
            </div>
            <div>
              <div style={{ fontSize: "0.86rem", fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                {item.at.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              <p style={{ margin: "0.3rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.55 }}>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
