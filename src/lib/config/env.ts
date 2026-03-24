import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
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
  MARKETPLACE_DEFAULT_COMMISSION_PERCENT: z.coerce.number().nonnegative().default(12),
  MARKETPLACE_DEFAULT_MARKUP_ENABLED: z.coerce.boolean().default(false),
  MARKETPLACE_DEFAULT_INVOICE_STRATEGY: z.string().default("provider_service_plus_platform_fee_receipt"),
  MARKETPLACE_DEFAULT_REFUND_APPLICATION_FEE: z.coerce.boolean().default(false),
  SESSION_SECRET: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  SIMPLY_POSTCODE_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_SUPPORT_WHATSAPP_URL: z.string().url().optional(),
  NEXT_PUBLIC_CRISP_WEBSITE_ID: z.string().optional(),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  const requiredInProduction: Array<keyof typeof env> = [
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
    "SESSION_SECRET",
    "CRON_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "SIMPLY_POSTCODE_API_KEY",
  ];

  for (const key of requiredInProduction) {
    const value = env[key];
    if (value === undefined || value === null || value === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${String(key)} is required in production`,
      });
    }
  }

  if (env.ALLOW_MOCK_STRIPE_CHECKOUT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ALLOW_MOCK_STRIPE_CHECKOUT"],
      message: "ALLOW_MOCK_STRIPE_CHECKOUT must be false in production",
    });
  }
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

/**
 * L-A FIX: Centralised app URL accessor.
 * Returns NEXT_PUBLIC_APP_URL in production (validated as required),
 * falls back to localhost:3000 in development/test.
 */
export function getAppUrl(): string {
  const env = getEnv();
  return env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * L-B FIX: Typed accessor for Prisma AdminSetting valueJson fields.
 * AdminSetting stores JSON in the shape { value: T }.
 * This eliminates `(setting?.valueJson as any)?.value` casts.
 */
export function getSettingValue<T = unknown>(
  setting: { valueJson: unknown } | null | undefined,
  fallback: T,
): T {
  if (!setting || setting.valueJson == null) return fallback;
  const json = setting.valueJson as Record<string, unknown>;
  if (typeof json === "object" && json !== null && "value" in json) {
    return (json.value as T) ?? fallback;
  }
  return fallback;
}
