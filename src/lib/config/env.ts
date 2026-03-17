import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  CONNECTED_ACCOUNT_MODE: z.enum(["express", "standard", "custom"]).default("express"),
  STRIPE_CHARGE_MODEL: z.enum(["direct_charges", "destination_charges", "separate_charges_and_transfers"]).default("direct_charges"),
  STRIPE_DEFAULT_COUNTRY: z.string().default("GB"),
  STRIPE_DEFAULT_CURRENCY: z.string().default("gbp"),
  STRIPE_PAYOUT_HOLD_DAYS: z.coerce.number().int().nonnegative().default(7),
  STRIPE_MANUAL_PAYOUTS: z.coerce.boolean().default(true),
  ALLOW_MOCK_STRIPE_CHECKOUT: z.coerce.boolean().default(false),
  MARKETPLACE_DEFAULT_BOOKING_FEE_GBP: z.coerce.number().nonnegative().default(12),
  MARKETPLACE_DEFAULT_COMMISSION_PERCENT: z.coerce.number().nonnegative().default(18),
  MARKETPLACE_DEFAULT_MARKUP_ENABLED: z.coerce.boolean().default(false),
  MARKETPLACE_DEFAULT_INVOICE_STRATEGY: z.string().default("provider_service_plus_platform_fee_receipt"),
  MARKETPLACE_DEFAULT_REFUND_APPLICATION_FEE: z.coerce.boolean().default(false),
  SESSION_SECRET: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

export type AppEnv = ReturnType<typeof getEnv>;

export function requireEnv(name: keyof AppEnv) {
  const env = getEnv();
  const value = env[name];
  if (value === undefined || value === null || value === "") {
    throw new Error(`${String(name)} is required`);
  }
  return value;
}
