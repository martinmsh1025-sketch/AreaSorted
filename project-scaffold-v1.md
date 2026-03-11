# London Cleaning Platform - Next.js Project Scaffold v1

## Purpose

This is the recommended project structure for building the MVP in `Next.js` with App Router, Prisma, Stripe, DocuSign, and messaging integrations.

## Architecture Goals

- keep public website and app flows in one codebase
- separate domain logic from route handlers
- make admin operations maintainable
- keep integrations isolated
- support SEO pages cleanly

## Recommended Root Structure

```text
london-cleaning-platform/
  app/
  components/
  features/
  lib/
  prisma/
  public/
  styles/
  scripts/
  types/
  tests/
  middleware.ts
  next.config.ts
  package.json
  tsconfig.json
  .env.local
```

## 1. App Directory

Recommended route structure:

```text
app/
  (marketing)/
    page.tsx
    about/page.tsx
    pricing/page.tsx
    faq/page.tsx
    contact/page.tsx
    instant-quote/page.tsx
    services/page.tsx
    services/[serviceSlug]/page.tsx
    areas/[locationSlug]/page.tsx
    areas/[locationSlug]/[serviceSlug]/page.tsx
    become-a-cleaner/page.tsx
    cleaner-jobs/page.tsx
    cleaner-jobs/[locationSlug]/page.tsx
    privacy-policy/page.tsx
    gdpr-policy/page.tsx
    terms-and-conditions/page.tsx
    cookie-policy/page.tsx
    cleaner-terms/page.tsx
  (auth)/
    customer/login/page.tsx
    cleaner/login/page.tsx
    admin/login/page.tsx
  (customer)/
    account/page.tsx
    account/profile/page.tsx
    account/bookings/page.tsx
    account/bookings/[bookingReference]/page.tsx
    account/bookings/[bookingReference]/reschedule/page.tsx
    account/bookings/[bookingReference]/cancel/page.tsx
    account/bookings/[bookingReference]/complaint/page.tsx
  (cleaner)/
    cleaner/apply/page.tsx
    cleaner/application-submitted/page.tsx
    cleaner/faq/page.tsx
    cleaner/dashboard/page.tsx
    cleaner/profile/page.tsx
    cleaner/availability/page.tsx
    cleaner/service-areas/page.tsx
    cleaner/documents/page.tsx
    cleaner/contracts/page.tsx
    cleaner/jobs/page.tsx
    cleaner/jobs/[jobReference]/page.tsx
    cleaner/score/page.tsx
    cleaner/support/page.tsx
  (booking)/
    book/page.tsx
    booking/confirmation/page.tsx
  (admin)/
    admin/dashboard/page.tsx
    admin/cleaners/page.tsx
    admin/cleaners/[id]/page.tsx
    admin/verification/page.tsx
    admin/contracts/page.tsx
    admin/customers/page.tsx
    admin/bookings/page.tsx
    admin/bookings/[id]/page.tsx
    admin/dispatch/page.tsx
    admin/payments/page.tsx
    admin/refunds/page.tsx
    admin/complaints/page.tsx
    admin/notifications/page.tsx
    admin/content/page.tsx
    admin/settings/page.tsx
    admin/audit-logs/page.tsx
  api/
    ...route handlers
  layout.tsx
  globals.css
```

## 2. Components Directory

Use for reusable UI, not business logic.

```text
components/
  ui/
    button.tsx
    input.tsx
    select.tsx
    modal.tsx
    table.tsx
    badge.tsx
    card.tsx
    tabs.tsx
  layout/
    site-header.tsx
    site-footer.tsx
    admin-sidebar.tsx
    dashboard-shell.tsx
  forms/
    address-fields.tsx
    availability-grid.tsx
    document-upload.tsx
    payment-form.tsx
  marketing/
    hero.tsx
    faq-list.tsx
    service-card.tsx
    testimonial-strip.tsx
  booking/
    quote-summary.tsx
    booking-status-badge.tsx
  cleaner/
    cleaner-status-card.tsx
    score-history-table.tsx
    job-offer-card.tsx
  admin/
    filters-bar.tsx
    metrics-grid.tsx
    review-checklist.tsx
    dispatch-panel.tsx
```

## 3. Features Directory

This is where domain modules should live.

```text
features/
  auth/
    actions/
    server/
    validation/
  quotes/
    actions/
    server/
    validation/
    components/
  bookings/
    actions/
    server/
    validation/
    components/
  customers/
    actions/
    server/
    validation/
  cleaners/
    actions/
    server/
    validation/
    components/
  verification/
    actions/
    server/
  contracts/
    actions/
    server/
  dispatch/
    actions/
    server/
  scoring/
    actions/
    server/
  complaints/
    actions/
    server/
  refunds/
    actions/
    server/
  notifications/
    actions/
    server/
  content/
    actions/
    server/
```

Suggested rule:
- route handlers stay thin
- `features/*/server` contains business logic
- `features/*/validation` contains Zod schemas
- `features/*/actions` contains server actions if used by forms

## 4. Lib Directory

Use for shared infrastructure and helper code.

```text
lib/
  prisma.ts
  auth.ts
  env.ts
  db/
    transactions.ts
  security/
    rate-limit.ts
    permissions.ts
    webhook-signature.ts
  pricing/
    calculate-quote.ts
    addons.ts
    surcharges.ts
  dispatch/
    match-cleaners.ts
    offer-expiry.ts
    priority-score.ts
  scoring/
    apply-score-event.ts
    score-rules.ts
  notifications/
    templates.ts
    send-email.ts
    send-sms.ts
    send-whatsapp.ts
  payments/
    stripe.ts
    refunds.ts
  contracts/
    docusign.ts
  storage/
    upload-url.ts
    file-validation.ts
  seo/
    metadata.ts
    structured-data.ts
  utils/
    currency.ts
    dates.ts
    references.ts
    logger.ts
```

## 5. Prisma Directory

```text
prisma/
  schema.prisma
  migrations/
  seed.ts
  seeds/
    pricing.ts
    service-pages.ts
    area-pages.ts
    admin-users.ts
```

Recommended early seeds:
- admin user
- default pricing rules
- service types
- initial London area pages

## 6. Public Directory

```text
public/
  images/
    brand/
    services/
    areas/
  icons/
  robots.txt
  sitemap.xml
```

If sitemap is generated dynamically, keep only static assets here.

## 7. Styles Directory

```text
styles/
  tokens.css
  utilities.css
```

Keep brand tokens explicit:
- colors
- spacing
- shadows
- radii
- typography scale

## 8. Types Directory

```text
types/
  api.ts
  auth.ts
  booking.ts
  cleaner.ts
  content.ts
  payment.ts
```

## 9. Scripts Directory

```text
scripts/
  seed.ts
  generate-area-pages.ts
  backfill-public-references.ts
```

Useful for:
- generating first location pages
- data backfills during schema changes

## 10. Tests Directory

```text
tests/
  unit/
    pricing/
    scoring/
    dispatch/
  integration/
    quotes/
    bookings/
    cleaner-onboarding/
    refunds/
  e2e/
    customer-booking.spec.ts
    cleaner-application.spec.ts
    dispatch-flow.spec.ts
```

Priority tests for MVP:
- quote calculation
- cancellation penalty logic
- complaint penalty logic
- dispatch first-accept-wins logic
- refund calculations

## 11. API Handler Structure

Recommended route handler pattern:

```text
app/api/
  quotes/route.ts
  quotes/[quoteReference]/route.ts
  checkout/session/route.ts
  cleaner-applications/route.ts
  cleaner-applications/[applicationId]/documents/upload-url/route.ts
  cleaner-applications/[applicationId]/documents/complete/route.ts
  account/
    me/route.ts
    addresses/route.ts
    bookings/route.ts
    bookings/[bookingReference]/route.ts
    bookings/[bookingReference]/reschedule/route.ts
    bookings/[bookingReference]/cancel/route.ts
    bookings/[bookingReference]/complaints/route.ts
  cleaner/
    me/route.ts
    onboarding-status/route.ts
    documents/route.ts
    contracts/route.ts
    availability/route.ts
    unavailable-dates/route.ts
    service-areas/route.ts
    jobs/route.ts
    jobs/[jobReference]/route.ts
    jobs/[jobReference]/accept/route.ts
    jobs/[jobReference]/decline/route.ts
    jobs/[jobReference]/cancel/route.ts
    score/route.ts
  admin/
    cleaners/route.ts
    cleaners/[id]/route.ts
    cleaners/[id]/status/route.ts
    cleaners/[id]/documents/[documentId]/review/route.ts
    cleaners/[id]/verification-review/route.ts
    cleaners/[id]/send-contract/route.ts
    cleaners/[id]/score-adjustment/route.ts
    customers/route.ts
    bookings/route.ts
    bookings/[id]/route.ts
    dispatch/jobs/route.ts
    dispatch/jobs/[id]/offer/route.ts
    dispatch/jobs/[id]/assign/route.ts
    dispatch/jobs/[id]/re-dispatch/route.ts
    refunds/route.ts
    complaints/route.ts
    complaints/[id]/review/route.ts
    notifications/route.ts
    content/service-pages/route.ts
    content/seo-pages/route.ts
    settings/pricing/route.ts
  webhooks/
    stripe/route.ts
    docusign/route.ts
    messaging/status/route.ts
```

## 12. Data Access Pattern

Recommended pattern:
- UI calls route handler or server action
- route handler validates input with Zod
- handler calls feature service
- feature service performs Prisma work and business rules
- shared infrastructure in `lib/`

Avoid:
- putting Prisma queries directly in many page components
- duplicating pricing, dispatch, or scoring logic across routes

## 13. Access Control Pattern

Suggested guards:
- `requireCustomer()`
- `requireCleaner()`
- `requireAdmin()`
- `requireAdminRole([SUPER_ADMIN, OPS_ADMIN])`

Apply at:
- route handlers
- server actions
- admin page loaders

## 14. Initial Build Order

Recommended practical order:

1. `lib/prisma.ts`, `lib/env.ts`, auth guards
2. marketing pages shell and metadata helpers
3. quote calculator and quote API
4. cleaner application flow and file upload helpers
5. admin verification screens
6. Stripe checkout flow
7. booking creation and customer account basics
8. dispatch engine and cleaner accept/decline flow
9. complaint/refund/scoring workflows

## 15. Environment Variables To Reserve Early

- `DATABASE_URL`
- `NEXTAUTH_SECRET` or auth provider keys
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DOCUSIGN_CLIENT_ID`
- `DOCUSIGN_CLIENT_SECRET`
- `DOCUSIGN_ACCOUNT_ID`
- `STORAGE_BUCKET_NAME`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `EMAIL_API_KEY`
- `APP_BASE_URL`

## 16. What To Build First In UI

The first three real pages to build should be:
- `app/(marketing)/page.tsx`
- `app/(cleaner)/cleaner/apply/page.tsx`
- `app/(marketing)/instant-quote/page.tsx`

Reason:
- they support both customer growth and cleaner recruitment from day one
