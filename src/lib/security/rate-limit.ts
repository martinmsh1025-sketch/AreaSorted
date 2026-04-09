/**
 * C-1/2 FIX: Simple in-memory rate limiter for auth endpoints.
 *
 * For production at scale, replace with Redis-backed implementation.
 * This is sufficient for single-instance deployments and prevents
 * brute-force attacks on login, OTP, and password reset endpoints.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) {
          store.delete(key);
        }
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Don't keep the process alive for cleanup
  const timer = cleanupTimer;
  if (timer && typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }
}

type RateLimitConfig = {
  /** Unique namespace to separate different rate limiters */
  namespace: string;
  /** Maximum number of attempts within the window */
  maxAttempts: number;
  /** Window duration in milliseconds */
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Check and consume a rate limit attempt.
 * Returns whether the request is allowed plus remaining attempts.
 *
 * @param config Rate limit configuration
 * @param key Unique identifier (e.g. IP address, email, or combination)
 */
export function checkRateLimit(config: RateLimitConfig, key: string): RateLimitResult {
  ensureCleanup();

  let store = stores.get(config.namespace);
  if (!store) {
    store = new Map();
    stores.set(config.namespace, store);
  }

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired — reset
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxAttempts - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Record a failed login attempt for lockout tracking.
 * Call this AFTER a login attempt is verified as failed (wrong password).
 * Returns whether the account is now locked.
 */
export function recordFailedLogin(email: string): { locked: boolean; remainingAttempts: number; lockoutMinutes: number } {
  const result = checkRateLimit(ACCOUNT_LOCKOUT, email.toLowerCase());
  return {
    locked: !result.allowed,
    remainingAttempts: result.remaining,
    lockoutMinutes: Math.ceil(ACCOUNT_LOCKOUT.windowMs / 60_000),
  };
}

/**
 * Check if an account is currently locked out (without consuming an attempt).
 */
export function isAccountLocked(email: string): boolean {
  ensureCleanup();
  const store = stores.get(ACCOUNT_LOCKOUT.namespace);
  if (!store) return false;
  const entry = store.get(email.toLowerCase());
  if (!entry) return false;
  const now = Date.now();
  if (now > entry.resetAt) return false;
  return entry.count >= ACCOUNT_LOCKOUT.maxAttempts;
}

/**
 * Clear the lockout counter for an account (e.g. after successful login).
 */
export function clearFailedLogins(email: string): void {
  const store = stores.get(ACCOUNT_LOCKOUT.namespace);
  if (store) store.delete(email.toLowerCase());
}

// ── Pre-configured rate limiters for common auth operations ──

/** Login attempts: 10 per 15 minutes per IP+email */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  namespace: "auth:login",
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

/**
 * H-18 FIX: Account lockout — 5 failed password attempts locks account for 30 minutes.
 * Keyed by email (case-insensitive). This is stricter than the general LOGIN_RATE_LIMIT
 * which is keyed by IP+email and allows 10 attempts.
 */
export const ACCOUNT_LOCKOUT: RateLimitConfig = {
  namespace: "auth:account-lockout",
  maxAttempts: 5,
  windowMs: 30 * 60 * 1000,
};

/** OTP verification: 5 attempts per 15 minutes per email (prevents brute-force of 6-digit code) */
export const OTP_RATE_LIMIT: RateLimitConfig = {
  namespace: "auth:otp",
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};

/** OTP send: 3 per 15 minutes per email (prevents OTP spam) */
export const OTP_SEND_RATE_LIMIT: RateLimitConfig = {
  namespace: "auth:otp-send",
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
};

/** Password reset request: 3 per 15 minutes per email */
export const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
  namespace: "auth:password-reset",
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
};

/** Registration: 5 per hour per IP */
export const REGISTER_RATE_LIMIT: RateLimitConfig = {
  namespace: "auth:register",
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,
};

// ── M-7/8/9/10 FIX: Rate limiters for public API endpoints ──

/** Contact form: 5 submissions per 15 minutes per IP */
export const CONTACT_RATE_LIMIT: RateLimitConfig = {
  namespace: "api:contact",
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};

/** Public quote creation: 10 per 15 minutes per IP */
export const PUBLIC_QUOTE_RATE_LIMIT: RateLimitConfig = {
  namespace: "api:public-quote",
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

/** Quote estimate (pricing preview): 30 per minute per IP */
export const QUOTE_ESTIMATE_RATE_LIMIT: RateLimitConfig = {
  namespace: "api:quote-estimate",
  maxAttempts: 30,
  windowMs: 60 * 1000,
};

/** Postcode lookup: 30 per minute per IP */
export const POSTCODE_RATE_LIMIT: RateLimitConfig = {
  namespace: "api:postcode",
  maxAttempts: 30,
  windowMs: 60 * 1000,
};
