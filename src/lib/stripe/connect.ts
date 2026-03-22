import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getEnv } from "@/lib/config/env";

export type ConnectedAccountSnapshot = {
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: Stripe.Account.Requirements | null;
};

export async function createExpressConnectedAccount(params: {
  email: string;
  businessName: string;
  country?: string;
}) {
  const stripe = getStripe();
  const env = getEnv();

  return stripe.accounts.create({
    type: env.CONNECTED_ACCOUNT_MODE,
    country: params.country || env.STRIPE_DEFAULT_COUNTRY,
    email: params.email,
    business_profile: {
      name: params.businessName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    controller: {
      stripe_dashboard: { type: "express" },
      fees: { payer: "application" },
      losses: { payments: "stripe" },
    },
  });
}

export async function createConnectedAccountOnboardingLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: params.accountId,
    type: "account_onboarding",
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
  });
}

export async function fetchConnectedAccountSnapshot(accountId: string): Promise<ConnectedAccountSnapshot> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return {
    stripeAccountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements ?? null,
  };
}

export async function createDirectChargeCheckoutSession(params: {
  connectedAccountId: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  applicationFeeAmount: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  const env = getEnv();

  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: params.lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      payment_intent_data: {
        capture_method: "manual",
        application_fee_amount: params.applicationFeeAmount,
        metadata: params.metadata,
      },
      metadata: params.metadata,
      currency: env.STRIPE_DEFAULT_CURRENCY,
    },
    {
      stripeAccount: params.connectedAccountId,
    },
  );
}

export async function captureDirectChargePaymentIntent(params: {
  connectedAccountId: string;
  paymentIntentId: string;
}) {
  const stripe = getStripe();
  return stripe.paymentIntents.capture(params.paymentIntentId, {}, {
    stripeAccount: params.connectedAccountId,
  });
}

export async function cancelDirectChargePaymentIntent(params: {
  connectedAccountId: string;
  paymentIntentId: string;
}) {
  const stripe = getStripe();
  return stripe.paymentIntents.cancel(params.paymentIntentId, {}, {
    stripeAccount: params.connectedAccountId,
  });
}

/**
 * H2 FIX: Create a refund on a direct charge connected account.
 * Supports full and partial refunds.
 */
export async function createDirectChargeRefund(params: {
  connectedAccountId: string;
  paymentIntentId: string;
  /** Amount in pence (smallest currency unit). Omit for full refund. */
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}) {
  const stripe = getStripe();
  return stripe.refunds.create(
    {
      payment_intent: params.paymentIntentId,
      ...(params.amount ? { amount: params.amount } : {}),
      ...(params.reason ? { reason: params.reason } : {}),
    },
    {
      stripeAccount: params.connectedAccountId,
    },
  );
}
