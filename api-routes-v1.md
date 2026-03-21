# AreaSorted - API Routes v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Legacy brand names (`WashHub`, `Alder London`) have been removed from all source code and data files. `AreaSorted` is the sole active brand.


## Purpose

This document defines the first practical backend API surface for the MVP.
It is designed for a `Next.js` app with route handlers, server actions where useful, and Prisma as the data layer.

## API Principles

- public endpoints should be minimal and rate-limited
- authenticated provider routes should use session-based auth with status gating
- authenticated customer routes should prefer secure access-link or session-based auth depending on flow
- admin routes should require role-based access
- file uploads should use signed upload flow where possible
- all state-changing admin actions should create audit logs
- booking, payment, scoring, cancellation, and refund logic should run server-side only

## Alignment Clarification

- `ProviderCompany` routes are the primary protected business actor APIs for the marketplace
- Cleaner or workforce APIs remain secondary operational APIs and should not redefine the top-level provider model

## Route Groups

- Public website
- Customer account
- Cleaner onboarding and portal
- Admin operations
- Stripe webhooks
- DocuSign webhooks
- Messaging webhooks/status sync

## 1. Public Website APIs

### `POST /api/quotes`
Purpose:
- create a quote from instant quote form

Input:
- postcode
- address fields
- property type
- bedrooms
- bathrooms
- estimated hours
- service type
- customer provides supplies
- booking type / recurring frequency
- preferred date/time
- add-ons
- notes

Output:
- quote reference
- line-item breakdown
- total amount
- expiry time

Rules:
- validate London service area
- apply pricing engine
- store quote record and quote addons

### `GET /api/quotes/[quoteReference]`
Purpose:
- fetch quote summary for checkout page

### `POST /api/contact`
Purpose:
- handle contact form submissions

### `POST /api/cleaner-applications`
Purpose:
- create cleaner application and cleaner record

Input:
- personal details
- contact details
- work preferences
- availability summary
- service areas
- consent flags

Output:
- application reference
- next step info

### `POST /api/cleaner-applications/[applicationId]/documents/upload-url`
Purpose:
- generate signed upload URL for a cleaner document

### `POST /api/cleaner-applications/[applicationId]/documents/complete`
Purpose:
- confirm uploaded document and create `CleanerDocument`

### `GET /api/content/service-pages/[slug]`
Purpose:
- fetch public CMS-backed service page content

### `GET /api/content/seo-pages/[slug]`
Purpose:
- fetch area or SEO landing content

## 2. Customer Auth And Account APIs

### `POST /api/auth/customer/register`
Purpose:
- create customer account during or after checkout

### `POST /api/auth/customer/login`
Purpose:
- customer login

### `POST /api/auth/customer/logout`
Purpose:
- customer logout

### `GET /api/account/me`
Purpose:
- return current customer profile

### `PATCH /api/account/me`
Purpose:
- update customer profile details

### `GET /api/account/addresses`
Purpose:
- list saved customer addresses

### `POST /api/account/addresses`
Purpose:
- create saved address

### `PATCH /api/account/addresses/[id]`
Purpose:
- update address

### `GET /api/account/bookings`
Purpose:
- list customer bookings

Filters:
- upcoming
- completed
- cancelled

### `GET /api/account/bookings/[bookingReference]`
Purpose:
- get booking detail, payment state, assignment summary, complaint/refund state

### `POST /api/account/bookings/[bookingReference]/reschedule`
Purpose:
- customer reschedule request

Rules:
- allow only if at least 48 hours before start
- allow one free reschedule only
- create booking history link using `parentBookingId` if implemented as new booking
- write audit log

### `POST /api/account/bookings/[bookingReference]/cancel`
Purpose:
- customer cancellation request

Rules:
- apply refund policy server-side
- create cancellation records
- notify admin if needed

### `POST /api/account/bookings/[bookingReference]/complaints`
Purpose:
- submit customer complaint

Input:
- complaint type
- description
- attachment reference

## 3. Checkout And Payment APIs

### `POST /api/checkout/session`
Purpose:
- create checkout/payment intent from quote

Input:
- quote reference
- customer details
- optional account creation data

Output:
- Stripe client secret or checkout session info

### `POST /api/bookings/from-quote`
Purpose:
- create provisional booking before payment confirmation if needed

### `POST /api/payments/confirm`
Purpose:
- internal post-payment confirmation if not relying solely on webhook

### `GET /api/account/payments/[paymentId]`
Purpose:
- fetch payment detail for receipt view

## 4. Cleaner Auth And Portal APIs

### `POST /api/auth/cleaner/login`
Purpose:
- cleaner login

### `POST /api/auth/cleaner/logout`
Purpose:
- cleaner logout

### `GET /api/cleaner/me`
Purpose:
- return cleaner profile, status, onboarding progress

### `PATCH /api/cleaner/me`
Purpose:
- update cleaner profile

### `GET /api/cleaner/onboarding-status`
Purpose:
- return document, contract, and activation checklist

### `GET /api/cleaner/documents`
Purpose:
- list uploaded documents and review statuses

### `POST /api/cleaner/documents/upload-url`
Purpose:
- signed upload URL for additional document upload

### `POST /api/cleaner/documents/complete`
Purpose:
- complete upload and create/update document record

### `GET /api/cleaner/contracts`
Purpose:
- fetch contract status history

### `POST /api/cleaner/contracts/resend`
Purpose:
- request resend if contract expired or link lost

### `GET /api/cleaner/availability`
Purpose:
- list weekly availability and blackout dates

### `PUT /api/cleaner/availability`
Purpose:
- replace cleaner weekly availability rules

### `GET /api/cleaner/unavailable-dates`
Purpose:
- list blackout dates

### `POST /api/cleaner/unavailable-dates`
Purpose:
- create blackout date

### `DELETE /api/cleaner/unavailable-dates/[id]`
Purpose:
- remove blackout date

### `GET /api/cleaner/service-areas`
Purpose:
- list cleaner postcode coverage

### `PUT /api/cleaner/service-areas`
Purpose:
- replace service area settings

### `GET /api/cleaner/jobs`
Purpose:
- list current and past jobs

Filters:
- offers
- upcoming
- completed
- cancelled

### `GET /api/cleaner/jobs/[jobReference]`
Purpose:
- fetch job detail

### `POST /api/cleaner/jobs/[jobReference]/accept`
Purpose:
- accept offered job

Rules:
- must still be within response window
- first valid acceptance wins
- create assignment records and notifications atomically

### `POST /api/cleaner/jobs/[jobReference]/decline`
Purpose:
- decline job offer

### `POST /api/cleaner/jobs/[jobReference]/cancel`
Purpose:
- cleaner cancellation

Rules:
- compute hours before start
- if under 48 hours, apply `-20`
- create `JobCancellation`
- notify admin via email and SMS
- trigger re-dispatch workflow

### `POST /api/cleaner/jobs/[jobReference]/mark-complete`
Purpose:
- cleaner completion signal

Rules:
- final completion may still need admin/customer confirmation later
- apply `+10` score if business rule says system auto-completes

### `GET /api/cleaner/score`
Purpose:
- score summary and recent score events

## 5. Admin Authentication And Users

### `POST /api/admin/auth/login`
### `POST /api/admin/auth/logout`
### `GET /api/admin/me`

Purpose:
- admin session handling

## 6. Admin Cleaner Management APIs

### `GET /api/admin/cleaners`
Purpose:
- paginated cleaner list with filters

Filters:
- status
- source
- score range
- postcode
- has own supplies
- contract status

### `GET /api/admin/cleaners/[id]`
Purpose:
- full cleaner profile for operations

### `PATCH /api/admin/cleaners/[id]`
Purpose:
- update cleaner admin-managed fields

### `POST /api/admin/cleaners/[id]/status`
Purpose:
- activate, suspend, reject, restore cleaner

### `GET /api/admin/cleaners/[id]/documents`
### `POST /api/admin/cleaners/[id]/documents/[documentId]/review`
Purpose:
- approve, reject, or request reupload of document

### `POST /api/admin/cleaners/[id]/verification-review`
Purpose:
- submit verification checklist and outcome

### `POST /api/admin/cleaners/[id]/send-contract`
Purpose:
- trigger DocuSign contract send

### `POST /api/admin/cleaners/[id]/score-adjustment`
Purpose:
- manual score correction

Rules:
- must create score log and audit log

## 7. Admin Customers, Quotes, And Bookings APIs

### `GET /api/admin/customers`
### `GET /api/admin/customers/[id]`

### `GET /api/admin/quotes`
### `GET /api/admin/quotes/[id]`

### `GET /api/admin/bookings`
Purpose:
- booking queue and operations list

Filters:
- date
- status
- postcode
- service type
- unassigned only

### `GET /api/admin/bookings/[id]`
Purpose:
- full booking detail with payment, job, score, complaint, refund timeline

### `PATCH /api/admin/bookings/[id]`
Purpose:
- edit internal notes or operational details

### `POST /api/admin/bookings/[id]/cancel`
Purpose:
- admin cancellation handling

### `POST /api/admin/bookings/[id]/reschedule`
Purpose:
- admin-assisted reschedule

## 8. Admin Dispatch APIs

### `GET /api/admin/dispatch/jobs`
Purpose:
- list jobs by dispatch state

Filters:
- unassigned
- offering
- assigned
- cancelled
- at risk within 24 hours

### `GET /api/admin/dispatch/jobs/[id]`
Purpose:
- get dispatch detail and eligible cleaners

### `POST /api/admin/dispatch/jobs/[id]/offer`
Purpose:
- send job offers to selected cleaners or matching batch

Input:
- cleaner IDs or matching strategy
- channel list
- response deadline

### `POST /api/admin/dispatch/jobs/[id]/assign`
Purpose:
- manual assignment to selected cleaner

### `POST /api/admin/dispatch/jobs/[id]/withdraw-offer`
Purpose:
- withdraw outstanding job offers

### `POST /api/admin/dispatch/jobs/[id]/re-dispatch`
Purpose:
- start next dispatch round after decline/cancellation/no response

### `POST /api/admin/dispatch/jobs/[id]/mark-no-cleaner-found`
Purpose:
- operational escalation state

## 9. Admin Payments And Refund APIs

### `GET /api/admin/payments`
### `GET /api/admin/payments/[id]`

### `GET /api/admin/refunds`
### `GET /api/admin/refunds/[id]`

### `POST /api/admin/refunds`
Purpose:
- create full or partial refund

Input:
- booking ID
- payment ID
- amount
- reason
- type

Rules:
- call Stripe
- persist refund result
- create audit log
- notify customer if processed

## 10. Admin Complaints APIs

### `GET /api/admin/complaints`
### `GET /api/admin/complaints/[id]`

### `POST /api/admin/complaints/[id]/review`
Purpose:
- uphold or reject complaint

Input:
- decision
- notes
- refund amount if any
- score penalty if any

Rules:
- upheld complaint applies `-30` by default unless overridden with reason
- if validated no-show, support `-50`

## 11. Notifications APIs

### `GET /api/admin/notifications`
Purpose:
- notification monitoring

### `GET /api/admin/notifications/[id]`

### `POST /api/admin/notifications/[id]/resend`
Purpose:
- retry failed notification

### `GET /api/admin/templates`
### `PATCH /api/admin/templates/[templateCode]`
Purpose:
- manage message templates if kept in DB/config

## 12. Content Management APIs

### `GET /api/admin/content/service-pages`
### `POST /api/admin/content/service-pages`
### `GET /api/admin/content/service-pages/[id]`
### `PATCH /api/admin/content/service-pages/[id]`

### `GET /api/admin/content/seo-pages`
### `POST /api/admin/content/seo-pages`
### `GET /api/admin/content/seo-pages/[id]`
### `PATCH /api/admin/content/seo-pages/[id]`

Purpose:
- manage SEO and trust content without code change for every page

## 13. Settings APIs

### `GET /api/admin/settings/pricing`
### `PATCH /api/admin/settings/pricing`

### `GET /api/admin/settings/scoring`
### `PATCH /api/admin/settings/scoring`

### `GET /api/admin/settings/refund-policy`
### `PATCH /api/admin/settings/refund-policy`

Purpose:
- avoid hard-coding core business rules forever

## 14. Webhooks

### `POST /api/webhooks/stripe`
Events to support:
- payment intent succeeded
- payment intent failed
- charge refunded

Responsibilities:
- mark payment status
- create booking/job if needed
- sync refund state
- trigger notifications

### `POST /api/webhooks/docusign`
Events to support:
- envelope sent
- envelope viewed
- envelope completed
- envelope declined

Responsibilities:
- update contract status
- activate next onboarding step when signed

### `POST /api/webhooks/messaging/status`
Purpose:
- sync delivery status for email/SMS/WhatsApp

## 15. Background Jobs / Internal Actions

These may not be public routes, but should exist as server-side jobs:
- expire unanswered job offers
- trigger next dispatch round
- check jobs with no cleaner within 24 hours
- send reminders before service
- mark no-show candidates for review
- apply score updates after complaint decision/completion

## 16. Validation And Security Notes

- all public forms need rate limiting and spam protection
- cleaner document uploads need content type and size checks
- no pricing logic should be trusted from client-side totals
- booking and refund permissions must be enforced server-side
- webhook signature verification is mandatory for Stripe and DocuSign
- admin routes should log actor and action details
