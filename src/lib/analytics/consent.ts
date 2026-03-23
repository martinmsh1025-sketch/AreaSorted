export const COOKIE_CONSENT_STORAGE_KEY = "areasorted_cookie_consent_v1";
export const COOKIE_CONSENT_COOKIE_NAME = "areasorted_cookie_consent";
export const COOKIE_CONSENT_EVENT = "areasorted:cookie-consent-change";

export type CookieConsentChoice = "accepted" | "necessary";

export function isCookieConsentChoice(value: unknown): value is CookieConsentChoice {
  return value === "accepted" || value === "necessary";
}

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (isCookieConsentChoice(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage read failures and fall back to cookies.
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`))
    ?.split("=")[1];

  return isCookieConsentChoice(cookieValue) ? cookieValue : null;
}

export function persistCookieConsent(choice: CookieConsentChoice) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
  } catch {
    // Ignore storage write failures and still persist to cookies.
  }

  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${choice}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
}
