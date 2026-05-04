import { signSessionValue, verifySessionValue } from "@/lib/security/session";

export const QUOTE_ACCESS_PARAM = "access";

function tokenValueFor(reference: string) {
  return `quote:${reference}`;
}

export function createQuoteAccessToken(reference: string) {
  return signSessionValue(tokenValueFor(reference));
}

export function verifyQuoteAccessToken(reference: string, token: string | null | undefined) {
  if (!reference || !token) return false;
  return verifySessionValue(token) === tokenValueFor(reference);
}

export function withQuoteAccess(path: string, reference: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${QUOTE_ACCESS_PARAM}=${encodeURIComponent(createQuoteAccessToken(reference))}`;
}

export function customerOwnsQuote(
  customerEmail: string | null | undefined,
  sessionEmail: string | null | undefined,
) {
  return Boolean(
    customerEmail &&
      sessionEmail &&
      customerEmail.trim().toLowerCase() === sessionEmail.trim().toLowerCase(),
  );
}
