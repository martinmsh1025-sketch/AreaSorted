# AreaSorted Architecture

## Final Architecture Decisions

### Marketplace Positioning
- Provider company is the seller of the service
- AreaSorted is the booking, assignment, support, and payment-facilitation layer
- Customer-facing platform pricing may include provider base price, booking fee, commission impact, and optional platform override logic

### Provider Model
- `ProviderCompany` is the main commercial entity
- Workers are not modeled as the commercial counterparty in MVP
- One active provider per `area + service category` in customer assignment logic
- Backup providers can be stored later in operational tables

### Finance Model
- Every booking stores an immutable `BookingPriceSnapshot`
- Every financial mutation creates `LedgerEntry` rows
- Stripe object IDs are stored against first-class finance records
- Invoices and receipts are configurable and not hardcoded to a single legal assumption

### State Ownership
- Booking state is internal domain state
- Payment, refund, dispute, and payout asynchronous transitions are synced from Stripe webhooks
- Webhook processing must be idempotent

### App Boundaries
- Existing customer-facing flow remains in place for now
- New backend capabilities are added behind that flow first
- New admin/provider areas are built under dedicated route groups

## Target Folder Tree

```text
src/
  app/
    admin/
      pricing/
      providers/
      assignments/
      finance/
      reconciliation/
      settings/
      stripe/
    provider/
      invite/
      onboarding/
      dashboard/
      pricing/
      availability/
      bookings/
      payouts/
      disputes/
      statements/
    api/
      stripe/
        webhook/
      admin/
      providers/
      pricing/
      finance/
      reconciliation/
  components/
    admin/
    provider/
    finance/
    shared/
  lib/
    auth/
    db/
    stripe/
    pricing/
    finance/
    ledger/
    invoicing/
    notifications/
    providers/
    bookings/
    validation/
    config/
  server/
    actions/
    services/
      bookings/
      providers/
      pricing/
      payments/
      payouts/
      refunds/
      disputes/
      reconciliation/
      invoicing/

prisma/
  schema.prisma
  marketplace.prisma
  migrations/

docker-compose.yml
.env.example
README.md
```

## Immediate Backend Workstream

1. Environment contract
2. Prisma marketplace schema
3. Prisma client bootstrap
4. Stripe Connect config layer
5. Pricing config and provider pricing domain
6. Admin pricing and provider management UI
