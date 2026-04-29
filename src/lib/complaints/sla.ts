import type { ComplaintStatus } from "@prisma/client";

export function getComplaintSlaMessage(status: ComplaintStatus, createdAt: Date) {
  const ageHours = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));

  if (status === "OPEN") {
    return ageHours < 24
      ? "Expected next update: within 1 business day."
      : "This case should already be under review. If you have new evidence, add it through support."
  }

  if (status === "UNDER_REVIEW") {
    return "Expected next update: usually within 1-2 business days while we review the booking record and evidence."
  }

  if (status === "UPHELD") {
    return "AreaSorted has upheld this case. Any refund, rework, or follow-up action should now be reflected in your booking updates."
  }

  if (status === "REJECTED") {
    return "This case was not upheld based on the current information. You can contact support if you need to provide important missing context."
  }

  return "This case has been resolved. If a new issue arises, contact support with your booking reference."
}
