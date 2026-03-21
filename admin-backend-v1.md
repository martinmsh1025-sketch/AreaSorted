# AreaSorted - Admin Backend v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Legacy brand names (`WashHub`, `Alder London`) have been removed from all source code and data files. `AreaSorted` is the sole active brand.


## Purpose

The admin backend is the operational heart of the business. It must allow the team to:
- review and activate provider companies
- review provider onboarding, Stripe readiness, and pricing readiness
- manage bookings and dispatch
- handle cancellations, complaints, and refunds
- monitor notifications and score changes
- keep audit history for compliance and dispute handling

## Alignment Clarification

- Provider-company administration is the primary admin surface for marketplace launch
- Cleaner or workforce administration remains secondary operational scope where still needed for dispatch or fulfilment

## Core Admin Areas

- Dashboard
- Cleaner Management
- Cleaner Verification
- Contracts
- Availability and Service Areas
- Customer Management
- Quotes and Bookings
- Dispatch Board
- Payments and Refunds
- Complaints
- Notifications
- Content / SEO Pages
- Settings
- Audit Logs

## 1. Dashboard

Purpose:
- give ops team a live operating picture

Widgets:
- bookings today
- pending assignments
- unfilled jobs within 24 hours
- cancellations today
- no-shows this week
- pending cleaner reviews
- pending refunds
- complaints under review
- payment failures
- recent admin alerts

Quick actions:
- review new cleaner
- open dispatch board
- process refund
- open complaint queue

## 2. Cleaner Management

Cleaner list fields:
- name
- email
- phone
- postcode
- source
- status
- current score
- own supplies yes/no
- DBS status
- contract status
- last activity

Actions:
- open profile
- change status
- suspend cleaner
- resend onboarding email
- resend contract
- view score log
- view cancellation history

Cleaner profile sections:
- personal details
- recruitment source
- uploaded documents
- verification notes
- contract timeline
- availability
- service areas
- preferences and supported services
- score summary
- score history
- job history
- complaint history
- admin notes

## 3. Cleaner Verification

Queue views:
- new applications
- missing documents
- under review
- approved pending contract
- rejected

Review checklist:
- ID verified
- right to work reviewed
- proof of address checked
- CV reviewed
- applicant photo reviewed
- DBS uploaded / not uploaded

Actions:
- approve
- reject
- request more info
- add review notes
- set next step

Important rules:
- every decision creates audit log
- sensitive documents only visible to authorized admin roles

## 4. Contracts

Contract list fields:
- cleaner name
- contract version
- provider
- status
- sent date
- signed date

Actions:
- send contract
- resend contract
- mark exception for manual review
- download signed copy

Rules:
- cleaner cannot become active before signed contract

## 5. Availability And Service Areas

Purpose:
- make dispatch workable

Admin can view and edit:
- weekly availability
- blackout dates
- postcode areas
- radius or priority area
- weekends / evenings capability
- service type preferences
- whether cleaner brings supplies

Useful ops actions:
- identify cleaners available for a given date/time/postcode
- bulk filter by postcode and day

## 6. Customer Management

Customer list fields:
- name
- email
- phone
- booking count
- total spend
- last booking date
- complaint count

Customer profile sections:
- contact details
- saved addresses
- booking history
- payment history
- refunds
- complaints
- internal notes

Actions:
- open bookings
- issue refund
- resend invoice / confirmation
- add support notes

## 7. Quotes And Bookings

Quote list fields:
- quote reference
- postcode
- service type
- total quoted amount
- created date
- status

Booking list fields:
- booking reference
- customer name
- date and time
- postcode
- service type
- total amount
- cleaner payout amount
- margin amount
- status
- assignment status

Booking detail sections:
- customer details
- service address
- property details
- booking notes
- add-ons
- supplies requirement
- payment state
- dispatch history
- cleaner assignment
- cancellation timeline
- complaint/refund timeline

Actions:
- reschedule booking
- cancel booking
- trigger refund flow
- manually assign cleaner
- re-open dispatch
- add internal note

## 8. Dispatch Board

Purpose:
- one of the most important admin screens

Views:
- unassigned jobs
- jobs currently being offered
- assigned jobs
- jobs cancelled by cleaner
- jobs at risk within 24 hours

For each job show:
- booking reference
- postcode
- date/time
- service duration
- supplies requirement
- customer amount
- cleaner payout
- current dispatch round
- time remaining before escalation

Dispatch actions:
- offer to selected cleaners
- widen search area
- increase payout manually
- assign manually
- withdraw offer
- mark no cleaner found
- trigger customer contact

Cleaner matching filters:
- postcode area
- available time
- active status
- score
- own supplies
- service type
- cancellation history

## 9. Payments And Refunds

Payments list fields:
- booking reference
- customer name
- amount
- Stripe status
- fees
- paid date

Refunds list fields:
- booking reference
- refund amount
- reason
- status
- processed by
- processed date

Actions:
- issue full refund
- issue partial refund
- add refund reason
- sync with Stripe
- view payment events

Rules:
- refund decisions should be logged
- high-value refunds may require role restriction

## 10. Complaints

Complaint list fields:
- booking reference
- customer
- cleaner
- complaint type
- submitted date
- status
- refund recommendation
- score penalty

Complaint detail sections:
- complaint description
- attachments
- service details
- cleaner assigned
- previous complaint history
- admin review notes
- final decision

Actions:
- mark upheld
- mark rejected
- set score penalty
- issue refund
- request more customer evidence
- add internal notes

Business rules to support:
- upheld complaint applies -30 score
- no-show complaint may also trigger -50 if validated as no-show event

## 11. Notifications Center

Purpose:
- ensure operational messages are actually sent

Views:
- all notifications
- failed messages
- cancellations sent to admin
- pending queued messages

Fields:
- recipient
- channel
- template
- related booking/job
- status
- provider status
- sent time

Actions:
- resend failed notification
- inspect provider error
- preview template usage

Important rule:
- cancellation should trigger email and SMS to admin

## 12. Content / SEO Management

Purpose:
- allow controlled publishing of customer and recruitment pages

Content types:
- service pages
- London area pages
- recruitment pages
- FAQs

Fields:
- slug
- title
- meta title
- meta description
- body content / blocks
- publish status
- canonical setting

Actions:
- create page
- edit page
- preview
- publish / unpublish

## 13. Settings

Suggested settings groups:
- base pricing
- add-on pricing
- weekend/evening surcharge
- urgent booking fee
- cleaner payout rates
- score rules
- refund rules
- notification templates
- service areas enabled
- legal document versioning

Important initial settings to keep editable:
- customer hourly rates
- cleaner payout hourly rates
- cancellation penalty points
- complaint penalty points
- no-show penalty points
- score queue threshold

## 14. Audit Logs

Must track:
- cleaner approval / rejection
- document review actions
- contract send / resend
- booking changes
- manual assignment
- refund actions
- complaint decisions
- score adjustments
- admin status changes

Fields to surface:
- who performed action
- what changed
- entity affected
- when it changed
- previous and new values if possible

## 15. Admin Roles

### Super Admin
- full access
- settings
- refunds
- score overrides
- user permissions

### Ops Admin
- bookings
- dispatch
- complaints
- refunds within allowed limits
- customer management

### Reviewer
- cleaner applications
- document verification
- contract follow-up

### Support
- customer records
- booking notes
- notifications
- limited complaint handling

## 16. Launch Priority

### Must Have For MVP
- dashboard
- cleaner list and profile
- cleaner verification queue
- contract status view
- booking list and booking detail
- dispatch board
- payments list
- refunds handling
- complaints queue
- notifications log
- audit log basics
- pricing/settings basics

### Strongly Recommended For MVP
- SEO content management
- role-based permissions
- internal admin notes
- saved filters for dispatch

### Can Wait For Phase 2
- advanced analytics
- payout automation
- bulk messaging campaigns
- advanced role matrix

## 17. Suggested Build Order

1. cleaner verification screens
2. booking and customer management
3. dispatch board
4. payment/refund management
5. complaints workflow
6. notifications center
7. content/SEO management
8. audit enhancements

## 18. Success Criteria For Admin v1

The backend is good enough to launch when staff can:
- review a new cleaner application from start to activation
- see paid bookings and assign jobs
- detect and react to cancellations quickly
- re-dispatch jobs without confusion
- process refunds and log decisions
- handle complaints and score penalties
- verify that admin alerts were sent
