import { createHmac, timingSafeEqual } from "node:crypto";

const SEPARATOR = ".";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === "replace-with-strong-random-secret") {
    throw new Error(
      "SESSION_SECRET is not configured. Set a strong random value in your .env file.",
    );
  }
  return secret;
}

/**
 * Sign a cookie value with HMAC-SHA256.
 * Returns `{value}.{signature}`.
 */
export function signSessionValue(value: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(value);
  const signature = hmac.digest("hex");
  return `${value}${SEPARATOR}${signature}`;
}

/**
 * Verify a signed cookie value.
 * Returns the original value if the signature is valid, or `null` if tampered.
 */
export function verifySessionValue(signedValue: string): string | null {
  const lastDot = signedValue.lastIndexOf(SEPARATOR);
  if (lastDot === -1) return null;

  const value = signedValue.slice(0, lastDot);
  const providedSignature = signedValue.slice(lastDot + 1);

  if (!value || !providedSignature) return null;

  const hmac = createHmac("sha256", getSecret());
  hmac.update(value);
  const expectedSignature = hmac.digest("hex");

  // Timing-safe comparison to prevent timing attacks
  const expected = Buffer.from(expectedSignature, "hex");
  const provided = Buffer.from(providedSignature, "hex");

  if (expected.length !== provided.length) return null;

  if (!timingSafeEqual(expected, provided)) return null;

  return value;
}
