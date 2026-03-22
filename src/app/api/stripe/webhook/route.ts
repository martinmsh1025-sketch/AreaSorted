import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/config/env";
import { getStripe } from "@/lib/stripe";
import { processStripeWebhookEvent } from "@/server/services/stripe/webhook-processor";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;

  try {
    const webhookSecret = String(requireEnv("STRIPE_WEBHOOK_SECRET"));
    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
    }

    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    // M-2 FIX: Don't leak Stripe signature verification error details
    if (process.env.NODE_ENV !== "production") {
      console.error("[stripe-webhook] Signature verification failed:", error instanceof Error ? error.message : "Unknown error");
    }
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const result = await processStripeWebhookEvent(event);
    // M-2 FIX: Don't spread internal result details in response
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    // M-2 FIX: Don't leak internal error messages
    if (process.env.NODE_ENV !== "production") {
      console.error("[stripe-webhook] Processing failed:", error instanceof Error ? error.message : "Unknown error");
    }
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
