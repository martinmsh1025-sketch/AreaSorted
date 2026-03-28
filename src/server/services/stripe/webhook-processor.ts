import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { createProviderNotification } from "@/lib/providers/notifications";
import { parsePreferredScheduleOptions } from "@/lib/quotes/preferred-schedule";
import { syncProviderLifecycleState } from "@/server/services/providers/activation";
import { ensurePayoutRecordForBooking, refreshPayoutRecordState } from "@/lib/payouts";
import { sendLoggedEmail } from "@/lib/notifications/logged-email";

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

  // C6 FIX: Update paymentReady flag, but do NOT unconditionally overwrite
  // provider status. Instead, delegate to syncProviderLifecycleState which
  // respects identity locks (SUSPENDED, REJECTED, etc.) and ACTIVE status.
  await prisma.providerCompany.update({
    where: { id: connected.providerCompanyId },
    data: {
      paymentReady: account.charges_enabled && account.payouts_enabled,
    },
  });

  // Let the lifecycle state machine determine the correct status
  try {
    await syncProviderLifecycleState(connected.providerCompanyId);
  } catch {
    // Non-critical — the provider status will be corrected on next sync
  }

  return { ignored: false };
}

async function syncPaymentIntent(event: Stripe.Event) {
  const prisma = getPrisma();
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const isCaptured = event.type === "payment_intent.succeeded";
  const isCanceled = event.type === "payment_intent.canceled";
  const isAuthorised = event.type === "payment_intent.amount_capturable_updated" || paymentIntent.status === "requires_capture";
  const isFailed = event.type === "payment_intent.payment_failed";

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
        paymentState: isCaptured ? "PAID" : isFailed ? "FAILED" : isCanceled ? "CANCELLED" : "PENDING",
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
      // H-25 FIX: Backfill stripeChargeId from the PaymentIntent's latest_charge
      stripeChargeId: (() => {
        const charge = paymentIntent.latest_charge;
        if (!charge) return record.stripeChargeId;
        return typeof charge === "string" ? charge : charge.id;
      })(),
      paymentState: isCaptured ? "PAID" : isFailed ? "FAILED" : isCanceled ? "CANCELLED" : record.paymentState,
      grossAmount: (paymentIntent.amount || 0) / 100,
      metadataJson: toJsonValue({
        ...(typeof record.metadataJson === "object" && record.metadataJson !== null ? record.metadataJson : {}),
        ...(paymentIntent.metadata || {}),
        authorizationStatus: isAuthorised ? "AUTHORIZED" : isCaptured ? "CAPTURED" : undefined,
        authorisedAt: isAuthorised ? new Date().toISOString() : undefined,
        capturedAt: isCaptured ? new Date().toISOString() : undefined,
      }),
    },
  });

  // H8 FIX: Only update booking status if the current status allows it.
  // Don't overwrite ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, etc.
  if (isCaptured || isAuthorised) {
    const currentBooking = await prisma.booking.findUnique({
      where: { id: updated.bookingId },
      select: { bookingStatus: true },
    });

    const currentStatus = currentBooking?.bookingStatus;
    // Only transition to PENDING_ASSIGNMENT from AWAITING_PAYMENT or ACCEPTING
    const allowedForAuth = ["AWAITING_PAYMENT", "ACCEPTING"];
    // For captured payments, don't overwrite terminal or advanced statuses
    const terminalStatuses = ["CANCELLED", "COMPLETED", "NO_CLEANER_FOUND"];

    if (isAuthorised && currentStatus && allowedForAuth.includes(currentStatus)) {
      await prisma.booking.update({
        where: { id: updated.bookingId },
        data: { bookingStatus: "PENDING_ASSIGNMENT" },
      });
    }
    // For captured payments, don't change status — it should already be ASSIGNED
    // (the capture happens after provider accept)
  }

  // Generate invoices when payment is captured
  if (isCaptured) {
    try {
      const { generateInvoicesForBooking } = await import("@/server/services/invoices/generate");
      await generateInvoicesForBooking(updated.bookingId);
    } catch {
      // Non-critical — invoices can be generated on-demand
    }

    try {
      const payoutRecord = await ensurePayoutRecordForBooking(updated.bookingId, prisma);
      if (payoutRecord) {
        await refreshPayoutRecordState(payoutRecord.id, prisma);
      }
    } catch {
      // Non-critical — payout hold records can be backfilled later
    }

  }

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

  // H-26 FIX: Notify admin (via provider notification to providerCompanyId) about the dispute
  // This ensures disputes are not silently recorded without anyone being alerted.
  try {
    if (providerCompanyId) {
      await createProviderNotification({
        providerCompanyId,
        type: "SYSTEM_MESSAGE",
        title: `Payment dispute — ${dispute.reason || "unknown reason"}`,
        message: `A dispute for £${(dispute.amount / 100).toFixed(2)} has been ${event.type === "charge.dispute.created" ? "opened" : "updated"} on booking. Status: ${statusMap[dispute.status] || dispute.status}`,
        link: `/provider/orders/${payment.bookingId}`,
        bookingId: payment.bookingId,
      });
    }
  } catch {
    // Non-critical
  }

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

async function syncCheckoutSessionCompleted(event: Stripe.Event) {
  const prisma = getPrisma();
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode !== "payment") {
    return { ignored: true, reason: "non_payment_session" };
  }

  /* Look up PaymentRecord by the checkout session ID stored during booking creation */
  const record = await prisma.paymentRecord.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: { booking: true },
  });

  if (!record) {
    return { ignored: true, reason: "payment_record_not_found_for_session" };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? undefined;

  /* Back-fill the payment intent ID so subsequent PI webhooks can also find this record */
  await prisma.paymentRecord.update({
    where: { id: record.id },
    data: {
      stripePaymentIntentId: paymentIntentId,
      stripeAccountId: typeof event.account === "string" ? event.account : record.stripeAccountId,
      paymentState: record.paymentState,
      metadataJson: toJsonValue({
        ...(typeof record.metadataJson === "object" && record.metadataJson !== null ? record.metadataJson : {}),
        checkoutSessionStatus: session.status,
        paymentStatus: session.payment_status,
        authorizationStatus: session.payment_status === "paid" ? "AUTHORIZED" : undefined,
        authorisedAt: session.payment_status === "paid" ? new Date().toISOString() : undefined,
      }),
    },
  });

  if (session.payment_status === "paid") {
    await prisma.booking.update({
      where: { id: record.bookingId },
      data: { bookingStatus: "PENDING_ASSIGNMENT" },
    });

    try {
      const { sendBookingConfirmationEmail } = await import("@/lib/notifications/booking-emails");
      await sendBookingConfirmationEmail(record.bookingId);
    } catch {
      // Non-critical
    }

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: record.bookingId },
        select: {
          providerCompanyId: true,
          servicePostcode: true,
          scheduledDate: true,
          quoteRequest: { select: { inputJson: true } },
        },
      });
      if (booking?.providerCompanyId) {
        const providerRecord = await prisma.providerCompany.findUnique({
          where: { id: booking.providerCompanyId },
          select: { contactEmail: true },
        });
        const dateStr = booking.scheduledDate
          ? new Date(booking.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : "TBC";
        const scheduleOptions = parsePreferredScheduleOptions(booking.quoteRequest?.inputJson);
        await createProviderNotification({
          providerCompanyId: booking.providerCompanyId,
          type: "NEW_ORDER",
          title: "Booking awaiting confirmation",
          message: `A new authorised booking in ${booking.servicePostcode} for ${dateStr}${scheduleOptions.length > 1 ? ` (${scheduleOptions.length} date options)` : ""} is waiting for your confirmation.`,
          link: `/provider/orders/${record.bookingId}`,
          bookingId: record.bookingId,
        });
        if (providerRecord?.contactEmail) {
          await sendLoggedEmail({
            to: providerRecord.contactEmail,
            subject: `New booking request awaiting confirmation — ${record.bookingId.slice(0, 8)}`,
            text: [
              `A new booking request is waiting for your confirmation.`,
              "",
              `Booking ID: ${record.bookingId}`,
              `Date: ${dateStr}`,
              `Postcode: ${booking.servicePostcode}`,
              scheduleOptions.length > 1 ? `Other schedule options: ${scheduleOptions.length - 1}` : "",
              "",
              `Open the order: ${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/provider/orders/${record.bookingId}`,
            ].filter(Boolean).join("\n"),
            templateCode: "provider_new_job_request",
            bookingId: record.bookingId,
            providerCompanyId: booking.providerCompanyId,
            payload: { bookingId: record.bookingId },
          });
        }
      }
    } catch {
      // Non-critical: notification delivery failure should not affect payment processing
    }
  }

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
      case "payment_intent.amount_capturable_updated":
      case "payment_intent.payment_failed":
      case "payment_intent.canceled":
        result = await syncPaymentIntent(event);
        break;
      case "checkout.session.completed":
        result = await syncCheckoutSessionCompleted(event);
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
