import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";

function toJsonValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value));
}

function paymentStateFromRefund(charge: Stripe.Charge) {
  if (!charge.amount_refunded || charge.amount_refunded <= 0) return "PAID" as const;
  return charge.amount_refunded >= charge.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
}

async function syncAccountUpdated(event: Stripe.Event) {
  const prisma = getPrisma();
  const account = event.data.object as Stripe.Account;

  const connected = await prisma.stripeConnectedAccount.findUnique({
    where: { stripeAccountId: account.id },
  });

  if (!connected) return { ignored: true, reason: "connected_account_not_found" };

  await prisma.stripeConnectedAccount.update({
    where: { id: connected.id },
    data: {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirementsJson: toJsonValue(account.requirements),
      lastSyncedAt: new Date(),
    },
  });

  await prisma.providerCompany.update({
    where: { id: connected.providerCompanyId },
    data: {
      paymentReady: account.charges_enabled && account.payouts_enabled,
      status: account.charges_enabled && account.payouts_enabled ? "STRIPE_ACTIVE" : "STRIPE_RESTRICTED",
    },
  });

  return { ignored: false };
}

async function syncPaymentIntent(event: Stripe.Event) {
  const prisma = getPrisma();
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  let record = await prisma.paymentRecord.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { booking: true },
  });

  const bookingId = paymentIntent.metadata?.bookingId || undefined;

  if (!record && bookingId) {
    record = await prisma.paymentRecord.create({
      data: {
        bookingId,
        stripeAccountId: typeof event.account === "string" ? event.account : undefined,
        stripePaymentIntentId: paymentIntent.id,
        paymentState: event.type === "payment_intent.succeeded" ? "PAID" : "FAILED",
        grossAmount: (paymentIntent.amount || 0) / 100,
        metadataJson: toJsonValue(paymentIntent.metadata || {}),
      },
      include: { booking: true },
    });
  }

  if (!record) return { ignored: true, reason: "payment_record_not_found" };

  const updated = await prisma.paymentRecord.update({
    where: { id: record.id },
    data: {
      stripeAccountId: typeof event.account === "string" ? event.account : record.stripeAccountId,
      stripePaymentIntentId: paymentIntent.id,
      paymentState: event.type === "payment_intent.succeeded" ? "PAID" : "FAILED",
      grossAmount: (paymentIntent.amount || 0) / 100,
      metadataJson: toJsonValue(paymentIntent.metadata || {}),
    },
  });

  await prisma.booking.update({
    where: { id: updated.bookingId },
    data: {
      bookingStatus: event.type === "payment_intent.succeeded" ? "PAID" : record.booking.bookingStatus,
    },
  });

  return { ignored: false };
}

async function syncChargeRefunded(event: Stripe.Event) {
  const prisma = getPrisma();
  const charge = event.data.object as Stripe.Charge;

  const payment = await prisma.paymentRecord.findFirst({
    where: {
      OR: [{ stripeChargeId: charge.id }, { stripePaymentIntentId: typeof charge.payment_intent === "string" ? charge.payment_intent : undefined }],
    },
    include: { booking: true },
  });

  if (!payment) return { ignored: true, reason: "payment_record_not_found" };

  for (const refund of charge.refunds?.data || []) {
    await prisma.refundRecord.upsert({
      where: { stripeRefundId: refund.id },
      update: {
        amount: refund.amount / 100,
        status: refund.status === "succeeded" ? "PROCESSED" : "PENDING",
        paymentRecordId: payment.id,
      },
      create: {
        bookingId: payment.bookingId,
        paymentRecordId: payment.id,
        stripeRefundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status === "succeeded" ? "PROCESSED" : "PENDING",
        refundReason: refund.reason || undefined,
        liability: "PLATFORM",
      },
    });
  }

  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      stripeChargeId: charge.id,
      paymentState: paymentStateFromRefund(charge),
    },
  });

  return { ignored: false };
}

async function syncDispute(event: Stripe.Event) {
  const prisma = getPrisma();
  const dispute = event.data.object as Stripe.Dispute;

  const payment = await prisma.paymentRecord.findFirst({
    where: { stripeChargeId: dispute.charge as string },
    include: { booking: true },
  });

  if (!payment) return { ignored: true, reason: "payment_record_not_found" };

  const providerCompanyId = payment.booking.providerCompanyId || undefined;
  const statusMap: Record<string, any> = {
    warning_needs_response: "NEEDS_EVIDENCE",
    warning_under_review: "SUBMITTED",
    warning_closed: "CLOSED",
    needs_response: "NEEDS_EVIDENCE",
    under_review: "SUBMITTED",
    won: "WON",
    lost: "LOST",
  };

  await prisma.disputeRecord.upsert({
    where: { stripeDisputeId: dispute.id },
    update: {
      status: statusMap[dispute.status] || "OPEN",
      amount: dispute.amount / 100,
      reason: dispute.reason || undefined,
      evidenceJson: toJsonValue(dispute.evidence_details || {}),
    },
    create: {
      bookingId: payment.bookingId,
      providerCompanyId,
      stripeDisputeId: dispute.id,
      status: statusMap[dispute.status] || "OPEN",
      amount: dispute.amount / 100,
      reason: dispute.reason || undefined,
      evidenceJson: toJsonValue(dispute.evidence_details || {}),
      platformAbsorbsLoss: false,
    },
  });

  return { ignored: false };
}

async function syncPayout(event: Stripe.Event) {
  const prisma = getPrisma();
  const payout = event.data.object as Stripe.Payout;

  const payoutRecord = await prisma.payoutRecord.findFirst({
    where: {
      OR: [
        { stripePayoutId: payout.id },
        {
          providerCompany: {
            stripeConnectedAccount: {
              stripeAccountId: typeof event.account === "string" ? event.account : undefined,
            },
          },
        },
      ],
    },
  });

  if (!payoutRecord) return { ignored: true, reason: "payout_record_not_found" };

  await prisma.payoutRecord.update({
    where: { id: payoutRecord.id },
    data: {
      stripePayoutId: payout.id,
      status: event.type === "payout.paid" ? "PAID" : "FAILED",
      amount: payout.amount / 100,
      availableOn: payout.arrival_date ? new Date(payout.arrival_date * 1000) : undefined,
      paidAt: event.type === "payout.paid" ? new Date() : payoutRecord.paidAt,
      failureCode: payout.failure_code || undefined,
    },
  });

  await prisma.booking.updateMany({
    where: { payoutRecords: { some: { id: payoutRecord.id } } },
    data: { bookingStatus: event.type === "payout.paid" ? "COMPLETED" : undefined },
  });

  return { ignored: false };
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  const prisma = getPrisma();

  let webhookEvent;

  try {
    webhookEvent = await prisma.webhookEvent.create({
      data: {
        provider: "STRIPE",
        externalEventId: event.id,
        eventType: event.type,
        status: "RECEIVED",
        payloadJson: toJsonValue(event),
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }

    webhookEvent = await prisma.webhookEvent.findUnique({
      where: { externalEventId: event.id },
    });
  }

  if (!webhookEvent) {
    throw new Error(`WebhookEvent not found for ${event.id}`);
  }

  if (webhookEvent.processed) {
    return { duplicate: true, webhookEventId: webhookEvent.id };
  }

  const claimResult = await prisma.webhookEvent.updateMany({
    where: {
      id: webhookEvent.id,
      processed: false,
      status: "RECEIVED",
    },
    data: {
      status: "PROCESSING",
    },
  });

  if (claimResult.count === 0) {
    const existing = await prisma.webhookEvent.findUnique({ where: { id: webhookEvent.id } });
    return {
      duplicate: true,
      webhookEventId: webhookEvent.id,
      processing: existing?.status === "PROCESSING",
    };
  }

  try {
    let result: { ignored: boolean; reason?: string } = { ignored: true, reason: "unsupported_event" };

    switch (event.type) {
      case "account.updated":
        result = await syncAccountUpdated(event);
        break;
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
        result = await syncPaymentIntent(event);
        break;
      case "charge.refunded":
        result = await syncChargeRefunded(event);
        break;
      case "charge.dispute.created":
      case "charge.dispute.updated":
      case "charge.dispute.closed":
        result = await syncDispute(event);
        break;
      case "payout.paid":
      case "payout.failed":
        result = await syncPayout(event);
        break;
      default:
        result = { ignored: true, reason: "unsupported_event" };
        break;
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
        status: result.ignored ? "IGNORED" : "PROCESSED",
        errorMessage: result.ignored ? result.reason : undefined,
      },
    });

    return { duplicate: false, ignored: result.ignored, reason: result.reason, webhookEventId: webhookEvent.id };
  } catch (error) {
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Webhook processing failed",
      },
    });
    throw error;
  }
}
