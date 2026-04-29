import type { ComplaintStatus } from "@prisma/client";

export type ComplaintTimelineItem = {
  label: string;
  detail: string;
  at: Date;
};

export function getComplaintTimeline(input: {
  status: ComplaintStatus;
  createdAt: Date;
  reviewedAt?: Date | null;
  resolutionNotes?: string | null;
}) {
  const items: ComplaintTimelineItem[] = [
    {
      label: "Case submitted",
      detail: "AreaSorted received the complaint and logged it for review.",
      at: input.createdAt,
    },
  ];

  if (["UNDER_REVIEW", "UPHELD", "REJECTED", "RESOLVED"].includes(input.status) && input.reviewedAt) {
    items.push({
      label: "Under review",
      detail: "The support team reviewed the booking timeline, evidence, and any provider response.",
      at: input.reviewedAt,
    });
  }

  if (input.status === "UPHELD" && input.reviewedAt) {
    items.push({
      label: "Complaint upheld",
      detail: input.resolutionNotes?.trim() || "AreaSorted upheld the complaint and applied the appropriate operational outcome.",
      at: input.reviewedAt,
    });
  }

  if (input.status === "REJECTED" && input.reviewedAt) {
    items.push({
      label: "Complaint not upheld",
      detail: input.resolutionNotes?.trim() || "The complaint was reviewed but not upheld on the available information.",
      at: input.reviewedAt,
    });
  }

  if (input.status === "RESOLVED" && input.reviewedAt) {
    items.push({
      label: "Case resolved",
      detail: input.resolutionNotes?.trim() || "The case has been resolved and no further action is currently pending.",
      at: input.reviewedAt,
    });
  }

  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}
