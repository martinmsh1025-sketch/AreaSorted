import type {
  LeadServiceCategory,
  LeadStatus,
  LeadSource,
  OutreachChannel,
  OutreachOutcome,
} from "@prisma/client";

export const LEAD_SERVICE_CATEGORIES: LeadServiceCategory[] = [
  "CLEANING",
  "PEST_CONTROL",
  "HANDYMAN",
  "FURNITURE_ASSEMBLY",
  "WASTE_REMOVAL",
  "GARDEN_MAINTENANCE",
];

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "ONBOARDING",
  "CONVERTED",
  "NOT_INTERESTED",
  "UNRESPONSIVE",
  "DUPLICATE",
  "INVALID",
];

export const LEAD_SOURCES: LeadSource[] = [
  "GOOGLE_MAPS",
  "COMPANIES_HOUSE",
  "CHECKATRADE",
  "YELL",
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "LOCAL_DIRECTORY",
  "TRADE_ASSOCIATION",
  "TRUSTPILOT",
  "REFERRAL",
  "MANUAL",
  "CSV_IMPORT",
  "OTHER",
];

export const OUTREACH_CHANNELS: OutreachChannel[] = [
  "EMAIL",
  "WHATSAPP",
  "PHONE",
  "LINKEDIN_DM",
  "FACEBOOK_DM",
  "INSTAGRAM_DM",
];

export const OUTREACH_OUTCOMES: OutreachOutcome[] = [
  "SENT",
  "DELIVERED",
  "OPENED",
  "REPLIED",
  "POSITIVE",
  "NEGATIVE",
  "NO_RESPONSE",
  "BOUNCED",
  "OPTED_OUT",
];

// ---------------------------------------------------------------------------
// Display label maps (shared between list and detail pages)
// ---------------------------------------------------------------------------

export const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  INTERESTED: "Interested",
  ONBOARDING: "Onboarding",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not interested",
  UNRESPONSIVE: "Unresponsive",
  DUPLICATE: "Duplicate",
  INVALID: "Invalid",
};

export const statusBadgeVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  NEW: "outline",
  CONTACTED: "secondary",
  REPLIED: "secondary",
  INTERESTED: "default",
  ONBOARDING: "default",
  CONVERTED: "default",
  NOT_INTERESTED: "destructive",
  UNRESPONSIVE: "destructive",
  DUPLICATE: "destructive",
  INVALID: "destructive",
};

export const sourceLabels: Record<string, string> = {
  GOOGLE_MAPS: "Google Maps",
  COMPANIES_HOUSE: "Companies House",
  CHECKATRADE: "Checkatrade",
  YELL: "Yell",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  LOCAL_DIRECTORY: "Local directory",
  TRADE_ASSOCIATION: "Trade association",
  TRUSTPILOT: "Trustpilot",
  REFERRAL: "Referral",
  MANUAL: "Manual",
  CSV_IMPORT: "CSV import",
  OTHER: "Other",
};

export const serviceCategoryLabels: Record<string, string> = {
  CLEANING: "Cleaning",
  PEST_CONTROL: "Pest control",
  HANDYMAN: "Handyman",
  FURNITURE_ASSEMBLY: "Furniture assembly",
  WASTE_REMOVAL: "Waste removal",
  GARDEN_MAINTENANCE: "Garden maintenance",
};

export const channelLabels: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  PHONE: "Phone",
  LINKEDIN_DM: "LinkedIn DM",
  FACEBOOK_DM: "Facebook DM",
  INSTAGRAM_DM: "Instagram DM",
};

export const outcomeLabels: Record<string, string> = {
  SENT: "Sent",
  DELIVERED: "Delivered",
  OPENED: "Opened",
  REPLIED: "Replied",
  POSITIVE: "Positive",
  NEGATIVE: "Negative",
  NO_RESPONSE: "No response",
  BOUNCED: "Bounced",
  OPTED_OUT: "Opted out",
};

export const outcomeBadgeVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  SENT: "outline",
  DELIVERED: "secondary",
  OPENED: "secondary",
  REPLIED: "default",
  POSITIVE: "default",
  NEGATIVE: "destructive",
  NO_RESPONSE: "secondary",
  BOUNCED: "destructive",
  OPTED_OUT: "destructive",
};
