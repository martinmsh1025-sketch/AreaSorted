import { normalizeUkPhone } from "@/lib/validation/uk-phone";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const TELEGRAM_REGEX = /^@?[A-Za-z0-9_]{5,32}$/;

export function validateProviderContactDetail(channel: string, value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false as const, error: `${channel} contact detail is required.` };
  }

  if (channel === "WhatsApp" || channel === "SMS" || channel === "Phone") {
    const normalized = normalizeUkPhone(trimmed);
    if (!normalized) {
      return { ok: false as const, error: `${channel} must be a valid UK phone number.` };
    }
    return { ok: true as const, normalized };
  }

  if (channel === "Email") {
    if (!EMAIL_REGEX.test(trimmed)) {
      return { ok: false as const, error: "Email contact must be a valid email address." };
    }
    return { ok: true as const, normalized: trimmed.toLowerCase() };
  }

  if (channel === "Telegram") {
    if (!TELEGRAM_REGEX.test(trimmed)) {
      return { ok: false as const, error: "Telegram must be a valid handle, for example @providername." };
    }
    return { ok: true as const, normalized: trimmed.startsWith("@") ? trimmed : `@${trimmed}` };
  }

  return { ok: true as const, normalized: trimmed };
}
