# AreaSorted - Sprint Plan v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Legacy brand names (`WashHub`, `Alder London`) have been removed from all source code and data files. `AreaSorted` is the sole active brand.


## Goal

Build and launch an MVP that can:
- recruit cleaners from Indeed and website traffic
- collect and review cleaner documents
- send cleaner contracts via DocuSign
- let customers get quotes and pay online
- dispatch jobs to cleaners
- handle cancellations, complaints, score changes, and refunds

## Recommended Delivery Model

- Sprint length: 1 week
- MVP target: 8-10 weeks
- First public launch target: end of Sprint 8 if scope controlled
- Buffer: 2 extra weeks for testing, legal text, and third-party integration delays

## Pre-Sprint 0 - Setup And Foundations

Objectives:
- create delivery structure and unblock development

Tasks:
- finalize project folder and planning docs
- confirm stack: Next.js, PostgreSQL, Prisma, Stripe, DocuSign, messaging provider
- create repo and environments
- set up database and Prisma
- define env variables list
- define brand basics: company name, logo placeholder, brand colors, typography direction
- define initial London service area list
- confirm launch pricing table
- confirm legal page placeholders needed for build

Outputs:
- working repo
- working database connection
- base Prisma schema in place
- deployment target chosen

## Sprint 1 - Database, Auth, Admin Shell

Objectives:
- establish application skeleton and internal admin access

Tasks:
- implement Prisma schema and first migrations
- create app layout and routing structure
- add admin authentication
- create admin shell navigation
- create seed data strategy
- build base UI primitives and shared components
- implement audit log helper structure

Outputs:
- authenticated admin shell
- database migrated
- internal app structure ready

## Sprint 2 - Cleaner Recruitment And Application Flow

Objectives:
- make recruitment traffic usable immediately

Tasks:
- build `Become a Cleaner` page
- build cleaner application form
- build document upload flow
- save cleaner, application, and document records
- create application submitted page
- create admin cleaner list
- create admin application review queue

Outputs:
- live cleaner application flow
- admin can review applications at basic level

## Sprint 3 - Cleaner Verification And Contracts

Objectives:
- allow onboarding from applicant to approved cleaner

Tasks:
- build cleaner profile view in admin
- build document review actions
- implement verification checklist and notes
- implement approve / reject / request more info actions
- integrate DocuSign send flow
- create contract status page for cleaner portal
- block activation until contract signed

Outputs:
- complete onboarding path from applicant to active cleaner

## Sprint 4 - Customer Website And SEO Core Pages

Objectives:
- launch trust-building and SEO-ready customer site

Tasks:
- build Home page
- build About page
- build Services overview
- build Pricing page
- build Contact page
- build FAQ page
- build Privacy, GDPR, Terms pages
- add SEO metadata structure
- add service page CMS-backed or content-file-backed model

Outputs:
- public website foundation live
- customer and cleaner trust significantly improved

## Sprint 5 - Quote, Booking, And Stripe Payment

Objectives:
- let customers self-serve from quote to payment

Tasks:
- build Instant Quote page
- implement quote calculation logic
- create booking checkout flow
- integrate Stripe payment intent flow
- create booking confirmation page
- create booking records after payment
- create customer account basics

Outputs:
- customer can quote and pay online
- booking enters system after payment

## Sprint 6 - Dispatch Engine And Notifications

Objectives:
- make paid bookings assignable to cleaners

Tasks:
- create job generation from paid booking
- implement cleaner matching filters
- implement job offers table flow
- create dispatch board in admin
- integrate WhatsApp/SMS/email offer notifications
- create cleaner accept / decline link flow
- assign first accepted cleaner
- handle offer expiry and next dispatch round

Outputs:
- live dispatch flow working end to end

## Sprint 7 - Reschedule, Cancellation, Scoring, Complaints

Objectives:
- support real operating rules and exception handling

Tasks:
- implement customer reschedule rules
- implement customer cancellation flow
- implement cleaner cancellation flow
- trigger admin email and SMS on cancellation
- implement scoring engine and score logs
- create complaints submission flow
- create admin complaint review flow
- apply complaint and no-show penalties

Outputs:
- scoring and operational risk logic live

## Sprint 8 - Refunds, Dashboards, Launch Preparation

Objectives:
- make business launch-safe

Tasks:
- implement refund workflows
- complete payments/refunds admin views
- improve dashboard widgets
- add notification logs and failure handling
- create core area SEO landing pages
- test whole flow from cleaner onboarding to completed booking
- fix production blockers
- add analytics and basic conversion tracking

Outputs:
- MVP launch candidate

## Sprint 9 - Buffer / Hardening

Use if needed for:
- DocuSign edge cases
- WhatsApp template approval delays
- legal page revisions
- payment/refund edge cases
- admin UX cleanup
- mobile form improvements

## Sprint 10 - Launch Support

Use for:
- production monitoring
- incident fixes
- first Indeed traffic adjustments
- first SEO content expansion
- first pricing changes

## MVP Scope Lock

Keep in MVP:
- recruitment pages
- cleaner application and docs
- admin review
- DocuSign
- SEO core site
- quote and booking
- Stripe payments
- dispatch
- notifications
- scoring
- complaints
- refunds

Do not add before launch unless critical:
- mobile app
- advanced AI dispatch
- automatic cleaner payouts
- loyalty program
- advanced recurring subscription logic
- commercial client portal

## Team Roles Needed

Minimum practical roles:
- product / founder
- full-stack developer
- UI designer or strong frontend implementer
- legal/policy review support
- ops tester who simulates real bookings and cleaner onboarding

## Key Dependencies

- Stripe account ready
- DocuSign account ready
- SMS / WhatsApp provider chosen
- legal pages drafted
- company email domain active
- cloud file storage configured

## Critical Risks By Sprint

- Sprint 2-3: document upload security and form completion
- Sprint 3: contract workflow delays
- Sprint 5: pricing logic complexity
- Sprint 6: messaging provider approvals and delivery
- Sprint 7: policy logic edge cases
- Sprint 8: refunds and admin exceptions

## Launch Readiness Checklist

- cleaner can apply and upload documents
- admin can approve cleaner and send contract
- signed cleaner can set availability
- customer can get quote and pay
- booking creates job
- cleaner can accept job link
- cleaner cancellation re-dispatch works
- admin is alerted by email and SMS for cancellations
- complaint can be submitted and reviewed
- refund can be processed
- legal pages visible
- SEO pages indexable

## Recommended Immediate Next Build Order

1. turn `schema.prisma` into migrations
2. scaffold Next.js app routes
3. build public Home, Become a Cleaner, and Instant Quote pages first
4. build admin verification and dispatch next
5. integrate Stripe before polishing content pages
