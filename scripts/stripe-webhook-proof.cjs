require('dotenv/config');

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' });

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_xxx';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function postEvent(event) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });

  const response = await fetch(`${BASE_URL}/api/stripe/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  });

  const json = await response.json();
  return { status: response.status, json };
}

async function setupFixtures() {
  const provider = await prisma.providerCompany.upsert({
    where: { companyNumber: 'AS-PROVIDER-001' },
    update: {},
    create: {
      legalName: 'Provider Demo Ltd',
      tradingName: 'Provider Demo',
      companyNumber: 'AS-PROVIDER-001',
      registeredAddress: '1 Demo Street, London',
      contactEmail: 'provider-demo@example.com',
      phone: '02000000000',
      status: 'STRIPE_PENDING',
    },
  });

  await prisma.stripeConnectedAccount.upsert({
    where: { providerCompanyId: provider.id },
    update: {
      stripeAccountId: 'acct_test_areasorted_provider_1',
      mode: 'EXPRESS',
      chargeModel: 'DIRECT_CHARGES',
    },
    create: {
      providerCompanyId: provider.id,
      stripeAccountId: 'acct_test_areasorted_provider_1',
      mode: 'EXPRESS',
      chargeModel: 'DIRECT_CHARGES',
    },
  });

  const customer = await prisma.customer.upsert({
    where: { email: 'customer-proof@example.com' },
    update: {},
    create: {
      firstName: 'Proof',
      lastName: 'Customer',
      email: 'customer-proof@example.com',
      phone: '07123456789',
    },
  });

  const address = await prisma.customerAddress.create({
    data: {
      customerId: customer.id,
      addressLine1: '10 Proof Road',
      city: 'London',
      postcode: 'SW6 2NT',
    },
  });

  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      customerAddressId: address.id,
      providerCompanyId: provider.id,
      serviceAddressLine1: '10 Proof Road',
      serviceCity: 'London',
      servicePostcode: 'SW6 2NT',
      propertyType: 'FLAT',
      serviceType: 'REGULAR_CLEANING',
      scheduledDate: new Date('2026-03-20T09:00:00.000Z'),
      scheduledStartTime: '09:00',
      durationHours: '3.00',
      totalAmount: '120.00',
      bookingStatus: 'AWAITING_PAYMENT',
    },
  });

  await prisma.paymentRecord.create({
    data: {
      bookingId: booking.id,
      stripeAccountId: 'acct_test_areasorted_provider_1',
      stripePaymentIntentId: 'pi_test_areasorted_1',
      grossAmount: '120.00',
      paymentState: 'PENDING',
    },
  });

  await prisma.payoutRecord.create({
    data: {
      bookingId: booking.id,
      providerCompanyId: provider.id,
      amount: '84.00',
      status: 'PENDING',
    },
  });

  return { provider, booking };
}

async function main() {
  const existingBookings = await prisma.booking.findMany({ where: { serviceAddressLine1: '10 Proof Road' }, select: { id: true } });
  const existingBookingIds = existingBookings.map((booking) => booking.id);

  await prisma.refundRecord.deleteMany({ where: { stripeRefundId: { startsWith: 're_test_' } } });
  await prisma.disputeRecord.deleteMany({ where: { stripeDisputeId: { startsWith: 'dp_test_' } } });
  await prisma.payoutRecord.deleteMany({ where: { OR: [{ stripePayoutId: { startsWith: 'po_test_' } }, { bookingId: { in: existingBookingIds } }] } });
  await prisma.ledgerEntry.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
  await prisma.invoiceRecord.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
  await prisma.notificationLogV2.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
  await prisma.bookingPriceSnapshot.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
  await prisma.paymentRecord.deleteMany({ where: { stripePaymentIntentId: { in: ['pi_test_areasorted_1'] } } });
  await prisma.booking.deleteMany({ where: { serviceAddressLine1: '10 Proof Road' } });
  await prisma.customerAddress.deleteMany({ where: { addressLine1: '10 Proof Road' } });
  await prisma.customer.deleteMany({ where: { email: 'customer-proof@example.com' } });
  await prisma.webhookEvent.deleteMany({ where: { externalEventId: { in: ['evt_test_account_updated_1','evt_test_payment_succeeded_1','evt_test_refund_1','evt_test_dispute_created_1','evt_test_dispute_updated_1','evt_test_dispute_closed_1','evt_test_payout_paid_1','evt_test_payout_failed_1','evt_test_concurrent_payment_1'] } } });

  const { provider, booking } = await setupFixtures();

  const accountUpdated = {
    id: 'evt_test_account_updated_1',
    object: 'event',
    type: 'account.updated',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'acct_test_areasorted_provider_1',
        object: 'account',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      },
    },
  };

  const paymentSucceeded = {
    id: 'evt_test_payment_succeeded_1',
    object: 'event',
    type: 'payment_intent.succeeded',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'pi_test_areasorted_1',
        object: 'payment_intent',
        amount: 12000,
        metadata: { bookingId: booking.id },
      },
    },
  };

  const refunded = {
    id: 'evt_test_refund_1',
    object: 'event',
    type: 'charge.refunded',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'ch_test_areasorted_1',
        object: 'charge',
        amount: 12000,
        amount_refunded: 12000,
        payment_intent: 'pi_test_areasorted_1',
        refunds: {
          data: [
            {
              id: 're_test_areasorted_1',
              amount: 12000,
              status: 'succeeded',
              reason: 'requested_by_customer',
            },
          ],
        },
      },
    },
  };

  const disputeCreated = {
    id: 'evt_test_dispute_created_1',
    object: 'event',
    type: 'charge.dispute.created',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'dp_test_areasorted_1',
        object: 'dispute',
        charge: 'ch_test_areasorted_1',
        amount: 12000,
        status: 'warning_needs_response',
        reason: 'fraudulent',
        evidence_details: { due_by: 1773600000 },
      },
    },
  };

  const disputeUpdated = {
    id: 'evt_test_dispute_updated_1',
    object: 'event',
    type: 'charge.dispute.updated',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'dp_test_areasorted_1',
        object: 'dispute',
        charge: 'ch_test_areasorted_1',
        amount: 12000,
        status: 'under_review',
        reason: 'fraudulent',
        evidence_details: { due_by: 1773600000, submission_count: 1 },
      },
    },
  };

  const disputeClosed = {
    id: 'evt_test_dispute_closed_1',
    object: 'event',
    type: 'charge.dispute.closed',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'dp_test_areasorted_1',
        object: 'dispute',
        charge: 'ch_test_areasorted_1',
        amount: 12000,
        status: 'lost',
        reason: 'fraudulent',
        evidence_details: { submission_count: 1 },
      },
    },
  };

  const payoutPaid = {
    id: 'evt_test_payout_paid_1',
    object: 'event',
    type: 'payout.paid',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'po_test_areasorted_1',
        object: 'payout',
        amount: 8400,
        arrival_date: 1773600000,
        failure_code: null,
      },
    },
  };

  const payoutFailed = {
    id: 'evt_test_payout_failed_1',
    object: 'event',
    type: 'payout.failed',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'po_test_areasorted_1',
        object: 'payout',
        amount: 8400,
        arrival_date: 1773600000,
        failure_code: 'account_closed',
      },
    },
  };

  const concurrentPayment = {
    id: 'evt_test_concurrent_payment_1',
    object: 'event',
    type: 'payment_intent.succeeded',
    account: 'acct_test_areasorted_provider_1',
    data: {
      object: {
        id: 'pi_test_areasorted_1',
        object: 'payment_intent',
        amount: 12000,
        metadata: { bookingId: booking.id },
      },
    },
  };

  console.log('account.updated ->', await postEvent(accountUpdated));
  console.log('account.updated duplicate ->', await postEvent(accountUpdated));
  console.log('payment_intent.succeeded ->', await postEvent(paymentSucceeded));
  console.log('payment_intent.succeeded duplicate ->', await postEvent(paymentSucceeded));
  console.log('charge.refunded ->', await postEvent(refunded));
  console.log('charge.refunded duplicate ->', await postEvent(refunded));
  console.log('charge.dispute.created ->', await postEvent(disputeCreated));
  console.log('charge.dispute.updated ->', await postEvent(disputeUpdated));
  console.log('charge.dispute.closed ->', await postEvent(disputeClosed));
  console.log('payout.paid ->', await postEvent(payoutPaid));
  console.log('payout.paid duplicate ->', await postEvent(payoutPaid));
  console.log('payout.failed ->', await postEvent(payoutFailed));

  const concurrentResults = await Promise.all([
    postEvent(concurrentPayment),
    postEvent(concurrentPayment),
    postEvent(concurrentPayment),
  ]);
  console.log('concurrent payment_intent.succeeded ->', concurrentResults);

  const providerAfter = await prisma.providerCompany.findUnique({ where: { id: provider.id }, include: { stripeConnectedAccount: true } });
  const paymentAfter = await prisma.paymentRecord.findFirst({ where: { stripePaymentIntentId: 'pi_test_areasorted_1' } });
  const refundAfter = await prisma.refundRecord.findFirst({ where: { stripeRefundId: 're_test_areasorted_1' } });
  const disputeAfter = await prisma.disputeRecord.findFirst({ where: { stripeDisputeId: 'dp_test_areasorted_1' } });
  const payoutAfter = await prisma.payoutRecord.findFirst({ where: { stripePayoutId: 'po_test_areasorted_1' } });
  const webhookEvents = await prisma.webhookEvent.findMany({
    where: { externalEventId: { in: ['evt_test_account_updated_1','evt_test_payment_succeeded_1','evt_test_refund_1','evt_test_dispute_created_1','evt_test_dispute_updated_1','evt_test_dispute_closed_1','evt_test_payout_paid_1','evt_test_payout_failed_1','evt_test_concurrent_payment_1'] } },
    orderBy: { externalEventId: 'asc' },
  });

  const concurrentEvent = webhookEvents.find((event) => event.externalEventId === 'evt_test_concurrent_payment_1');

  console.log(JSON.stringify({
    providerStatus: providerAfter?.status,
    providerPaymentReady: providerAfter?.paymentReady,
    stripeChargesEnabled: providerAfter?.stripeConnectedAccount?.chargesEnabled,
    stripePayoutsEnabled: providerAfter?.stripeConnectedAccount?.payoutsEnabled,
    paymentState: paymentAfter?.paymentState,
    refundStatus: refundAfter?.status,
    disputeStatus: disputeAfter?.status,
    payoutStatus: payoutAfter?.status,
    payoutFailureCode: payoutAfter?.failureCode,
    concurrentWebhookStatus: concurrentEvent?.status,
    concurrentWebhookProcessed: concurrentEvent?.processed,
    webhookEvents: webhookEvents.map((event) => ({
      externalEventId: event.externalEventId,
      status: event.status,
      processed: event.processed,
    })),
  }, null, 2));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
