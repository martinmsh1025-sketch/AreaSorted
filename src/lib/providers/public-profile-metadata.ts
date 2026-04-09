export const providerContactChannelOptions = ["WhatsApp", "SMS", "Phone", "Telegram", "Email"] as const;
export const providerResponseTimeOptions = [
  "Usually replies within 15 mins",
  "Usually replies within 30 mins",
  "Usually replies within 1 hour",
  "Usually replies within 2 hours",
  "Usually replies the same day",
] as const;
export const providerCommitmentOptions = [
  "Own supplies",
  "Weekend slots",
  "Arrival updates",
  "Photo updates",
  "Same-day updates",
  "Eco products available",
  "Emergency slots",
  "Invoice support",
  "Landlord-ready checklists",
  "Flexible weekday slots",
] as const;
export const providerLanguageOptions = [
  "English",
  "Cantonese",
  "Mandarin",
  "Polish",
  "Romanian",
  "Spanish",
  "French",
  "Urdu",
  "Hindi",
] as const;

export type PublicProfileMetadata = {
  supportedContactChannels: string[];
  contactDetails: Partial<Record<(typeof providerContactChannelOptions)[number], string>>;
  responseTimeLabel: string | null;
  serviceCommitments: string[];
  languagesSpoken: string[];
};

const EMPTY_METADATA: PublicProfileMetadata = {
  supportedContactChannels: [],
  contactDetails: {},
  responseTimeLabel: null,
  serviceCommitments: [],
  languagesSpoken: [],
};

function normalizeAgainstOptions(value: unknown, allowed: readonly string[]) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => allowed.includes(item))
    .slice(0, 8);
}

function normalizeContactDetails(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const next: Partial<Record<(typeof providerContactChannelOptions)[number], string>> = {};
  for (const option of providerContactChannelOptions) {
    const raw = (value as Record<string, unknown>)[option];
    if (typeof raw === "string" && raw.trim()) {
      next[option] = raw.trim().slice(0, 120);
    }
  }
  return next;
}

export function parseProviderPublicProfileMetadata(raw: string | null | undefined): PublicProfileMetadata {
  if (!raw) return EMPTY_METADATA;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const supportedContactChannels = normalizeAgainstOptions(parsed.supportedContactChannels, providerContactChannelOptions);
    return {
      supportedContactChannels,
      contactDetails: normalizeContactDetails(parsed.contactDetails),
      responseTimeLabel:
        typeof parsed.responseTimeLabel === "string" && providerResponseTimeOptions.includes(parsed.responseTimeLabel as never)
          ? parsed.responseTimeLabel
          : null,
      serviceCommitments: normalizeAgainstOptions(parsed.serviceCommitments, providerCommitmentOptions),
      languagesSpoken: normalizeAgainstOptions(parsed.languagesSpoken, providerLanguageOptions),
    };
  } catch {
    return EMPTY_METADATA;
  }
}

export function stringifyProviderPublicProfileMetadata(input: PublicProfileMetadata) {
  return JSON.stringify({
    supportedContactChannels: normalizeAgainstOptions(input.supportedContactChannels, providerContactChannelOptions),
    contactDetails: normalizeContactDetails(input.contactDetails),
    responseTimeLabel:
      input.responseTimeLabel && providerResponseTimeOptions.includes(input.responseTimeLabel as never)
        ? input.responseTimeLabel
        : null,
    serviceCommitments: normalizeAgainstOptions(input.serviceCommitments, providerCommitmentOptions),
    languagesSpoken: normalizeAgainstOptions(input.languagesSpoken, providerLanguageOptions),
  });
}
