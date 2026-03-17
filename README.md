# AreaSorted

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Where this document still references older names such as `WashHub`, `Alder London`, or `London Cleaning Platform`, treat them as legacy wording pending full content rewrite; `AreaSorted` is the active brand.


AreaSorted is a managed marketplace for local home and property services.

This codebase keeps the provider as the primary service seller by default and treats the platform as the booking facilitator / marketplace layer.

## Authoritative product decisions

- Active brand: `AreaSorted`
- Authoritative business model: managed marketplace with `ProviderCompany` as the primary commercial entity
- Primary protected backoffice flow: `admin invite -> provider email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`
- `Cleaner` or worker flows are legacy or secondary workforce modules and must not override provider-company marketplace decisions
- Customer-facing booking and quote UX remains customer-first; provider onboarding and provider portal are separate protected flows

## Local development bootstrap

Prisma uses:

- schema source: `prisma/schema.prisma`
- migration source: `prisma/migrations/`
- Prisma config: `prisma.config.ts`

`prisma/marketplace.prisma` has been removed because it was only an earlier draft and is not authoritative.

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
cp .env.example .env.local
```

Set at minimum:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/areasorted
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 3. Start PostgreSQL with Docker

```bash
npm run db:up
```

### 4. Run Prisma generate

```bash
npm run prisma:generate
```

### 5. Apply database migrations

```bash
npm run prisma:migrate:deploy
```

The initial migration SQL in `prisma/migrations/20260315173000_marketplace_foundation/migration.sql` was generated from the current authoritative schema and must be applied to a real PostgreSQL database before seed runs successfully.

For local schema changes during development you can also use:

```bash
npm run prisma:migrate:dev
```

### 6. Seed initial roles and settings

```bash
npm run prisma:seed
```

### 7. Start the app

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Useful commands

```bash
npm run db:logs
npm run db:down
npm run prisma:studio
npm run build
```

## Implemented backend foundation

- Prisma marketplace schema integrated into `prisma/schema.prisma`
- Initial migration SQL under `prisma/migrations/`
- Prisma client bootstrap in `src/lib/db/`
- Stripe Connect abstraction in `src/lib/stripe/connect.ts`
- Provider onboarding domain service in `src/server/services/providers/onboarding.ts`
- Provider onboarding/admin scaffolding under:
  - `src/app/admin/providers/`
  - `src/app/provider/`
- Pricing backend foundation in:
  - `src/lib/pricing-config-store.ts`
  - `src/app/admin/pricing/`

## Temporary compromises

- Existing customer booking/payment flow still uses the pre-Prisma operational path in parts of the app.
- `src/lib/pricing-config-store.ts` still uses temporary file storage and is scheduled to move fully into Prisma in the next backend step.
- Existing cleaner-related legacy models remain in the main schema because they are still used by current pages.

## Stripe / marketplace note

The intended payment model is:

- Stripe Connect
- direct charges by default
- provider remains primary service seller
- AreaSorted earns booking fee and/or application fee
- payout timing and invoice strategy remain configurable
