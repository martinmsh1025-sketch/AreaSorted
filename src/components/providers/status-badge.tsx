import { Badge } from "@/components/ui/badge";
import {
  providerDocumentStatusLabels,
  providerStatusLabels,
} from "@/lib/providers/service-catalog-mapping";

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  INVITED: "outline",
  EMAIL_VERIFICATION_PENDING: "secondary",
  PASSWORD_SETUP_PENDING: "secondary",
  ONBOARDING_IN_PROGRESS: "secondary",
  SUBMITTED_FOR_REVIEW: "secondary",
  UNDER_REVIEW: "secondary",
  CHANGES_REQUESTED: "destructive",
  REJECTED: "destructive",
  APPROVED: "default",
  STRIPE_PENDING: "secondary",
  STRIPE_RESTRICTED: "destructive",
  PRICING_PENDING: "secondary",
  ACTIVE: "default",
  SUSPENDED: "destructive",
};

const documentVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  NEEDS_RESUBMISSION: "destructive",
};

export function ProviderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariantMap[status] || "outline"}>
      {providerStatusLabels[status] || status}
    </Badge>
  );
}

export function ProviderDocumentBadge({ status }: { status: string }) {
  return (
    <Badge variant={documentVariantMap[status] || "outline"}>
      {providerDocumentStatusLabels[status] || status}
    </Badge>
  );
}
