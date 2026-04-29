import type { ComplaintStatus } from "@prisma/client";

export function CaseStatusBadge({ status }: { status: ComplaintStatus }) {
  const styles: Record<ComplaintStatus, { background: string; color: string; border: string }> = {
    OPEN: { background: "#fff1f2", color: "#be123c", border: "1px solid rgba(190,18,60,0.16)" },
    UNDER_REVIEW: { background: "#eff6ff", color: "#1d4ed8", border: "1px solid rgba(29,78,216,0.16)" },
    UPHELD: { background: "#fef3c7", color: "#92400e", border: "1px solid rgba(146,64,14,0.16)" },
    REJECTED: { background: "#f3f4f6", color: "#374151", border: "1px solid rgba(55,65,81,0.16)" },
    RESOLVED: { background: "#ecfdf5", color: "#047857", border: "1px solid rgba(4,120,87,0.16)" },
  };

  const tone = styles[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.55rem",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        background: tone.background,
        color: tone.color,
        border: tone.border,
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
