# AreaSorted Backend MVP Scope

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Where this document still references older names such as `WashHub`, `Alder London`, or `London Cleaning Platform`, treat them as legacy wording pending full content rewrite; `AreaSorted` is the active brand.


This file records the agreed backend development scope so the project can continue safely across sessions.

## Commercial Model

- Selected model: `Model B` managed marketplace
- Provider is the primary service seller by default
- Platform is the marketplace / booking facilitator
- Provider is a company-level entity, not an individual worker
- Provider may fulfil services using its own staff or subcontracted workers
- Platform controls booking flow, support layer, pricing presentation, assignment logic, and platform fees
- Provider remains primarily responsible for fulfilment

## Payment / Finance Direction

- Stripe Connect default mode: `express`
- Stripe charge model default: `direct_charges`
- Platform revenue should come from:
  - booking fee
  - application fee / commission
  - optional markup, disabled by default
- Payouts should support:
  - delayed payout after completion
  - configurable hold period
  - manual payout review flow
- Invoice strategy and refund behavior must stay configurable

## Customer-Facing Constraints

- Do not redesign the current customer-facing booking flow unless explicitly requested
- Backend work must be added behind the scenes first
- Keep wording compatible with provider-as-seller mode

## Auth And Portal Direction

- Provider portal access is invite-only for MVP
- Provider lifecycle is `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`
- Provider pages must be gated by provider status, not only by whether a session exists
- Admin pages must use authenticated user sessions with roles; shared-password access is not the target architecture
- Customer booking management should prefer secure access-link flows over mandatory pre-booking account creation

## Required Capability Areas

1. Provider onboarding
2. Provider company profile and compliance records
3. Stripe Connect account lifecycle
4. Provider pricing portal
5. Admin pricing control and overrides
6. Area-to-provider assignment
7. Immutable booking price snapshots
8. Payment / refund / dispute / payout state machines
9. Internal ledger
10. Reconciliation
11. Invoice strategy configuration
12. Notification logging
13. Webhook event logging and replay safety

## Build Order

### Phase A - Foundation
- Architecture decisions doc
- Folder tree
- Environment contract
- Prisma marketplace schema draft
- Docker compose for app + database

### Phase B - Core Domain
- Provider company domain
- Coverage assignment domain
- Pricing config domain
- Booking price snapshot domain
- Ledger domain
- Admin settings domain

### Phase C - Stripe Connect
- Connected account creation
- Onboarding links / embedded onboarding
- Direct charge flow
- Application fee handling
- Webhook ingestion
- Payout orchestration

### Phase D - UI Surfaces
- Provider onboarding portal
- Provider pricing portal
- Admin provider management
- Admin pricing control
- Admin finance / reconciliation

### Phase E - Finance Operations
- Refund console
- Dispute console
- Invoice generation
- Statements and exports

### Phase F - Hardening
- Tests
- Retry / idempotency
- README
- Deployment notes

## Current Decision Log

- Use provider-company model
- Keep platform as facilitator, not merchant-of-record by default
- Make invoice ownership configurable
- Make refund policy configurable
- Make payout timing configurable
- Use immutable price snapshots per booking
- Use webhooks as async source of truth
