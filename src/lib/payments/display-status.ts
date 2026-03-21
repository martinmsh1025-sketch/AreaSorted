type MetadataLike = Record<string, unknown> | null | undefined;

function asRecord(value: unknown): MetadataLike {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function getDisplayPaymentStatus(input: {
  paymentState?: string | null;
  metadataJson?: unknown;
  bookingStatus?: string | null;
}) {
  const metadata = asRecord(input.metadataJson);
  const authorizationStatus = typeof metadata?.authorizationStatus === "string"
    ? metadata.authorizationStatus
    : null;

  if (input.paymentState === "PAID") return "CAPTURED";
  if (input.paymentState === "CANCELLED" && authorizationStatus === "AUTHORIZED") return "RELEASED";
  if (authorizationStatus === "AUTHORIZED") return "AUTHORIZED";
  if (input.paymentState) return input.paymentState;
  if (input.bookingStatus === "PAID" || input.bookingStatus === "COMPLETED") return "CAPTURED";
  return "PENDING";
}

export function getPaymentStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CAPTURED":
      return "default";
    case "AUTHORIZED":
      return "secondary";
    case "RELEASED":
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

export function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "CAPTURED":
      return "Payment Captured";
    case "AUTHORIZED":
      return "Card Hold Active";
    case "RELEASED":
      return "Hold Released";
    default:
      return status.replace(/_/g, " ");
  }
}
