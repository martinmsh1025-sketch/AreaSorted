const serviceTypeLabels: Record<string, string> = {
  CLEANING: "Cleaning",
  PEST_CONTROL: "Pest Control",
  HANDYMAN: "Handyman",
  FURNITURE_ASSEMBLY: "Furniture Assembly",
  WASTE_REMOVAL: "Waste Removal",
  GARDEN_MAINTENANCE: "Garden Maintenance",
  REGULAR_CLEANING: "Regular Cleaning",
  DEEP_CLEANING: "Deep Cleaning",
  OFFICE_CLEANING: "Office Cleaning",
  AIRBNB_TURNOVER: "Airbnb Turnover",
  END_OF_TENANCY: "End Of Tenancy",
};

const propertyTypeLabels: Record<string, string> = {
  FLAT: "Flat",
  HOUSE: "House",
  OFFICE: "Office",
  STUDIO: "Studio",
  OTHER: "Other",
};

const bookingStatusLabels: Record<string, string> = {
  PENDING_ASSIGNMENT: "Pending confirmation",
  ASSIGNED: "Accepted",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  NO_CLEANER_FOUND: "Declined",
  CANCELLED: "Cancelled",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  REFUND_PENDING: "Refund pending",
  REFUNDED: "Refunded",
};

export function formatServiceType(value: string) {
  return serviceTypeLabels[value] || formatEnumLabel(value);
}

export function formatPropertyType(value: string) {
  return propertyTypeLabels[value] || formatEnumLabel(value);
}

export function formatBookingStatus(value: string) {
  return bookingStatusLabels[value] || formatEnumLabel(value);
}

export function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function canAcceptOrder(status: string) {
  return status === "PENDING_ASSIGNMENT";
}

export function canStartOrder(status: string) {
  return status === "ASSIGNED";
}

export function canCompleteOrder(status: string) {
  return status === "IN_PROGRESS";
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
