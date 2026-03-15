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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook" }, { status: 400 });
  }

  try {
    const result = await processStripeWebhookEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed" }, { status: 500 });
  }
}
