# AreaSorted - Instant Quote Design Spec v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Where this document still references older names such as `WashHub`, `Alder London`, or `London Cleaning Platform`, treat them as legacy wording pending full content rewrite; `AreaSorted` is the active brand.


## Purpose

This page is the main customer conversion page.
It must make quoting and booking feel:
- simple
- transparent
- trustworthy
- worth completing on mobile or desktop

## Core Goals

- convert visitors into quotes and bookings
- make pricing feel clear enough to trust
- reassure customers about cleaner quality and support
- surface key policy points before checkout

## Page Structure

### 1. Header
- same global header
- keep quote-focused environment with minimal distraction
- primary action should remain quote / booking progression

### 2. Intro / Hero Band
Purpose:
- explain value of the page quickly

Content:
- headline such as getting a cleaning quote in minutes
- short support text on transparent pricing and secure booking
- trust bullets:
  - verified cleaners
  - secure Stripe payment
  - London service coverage
  - support if plans change

### 3. Main Two-Column Layout
Left:
- quote form

Right:
- sticky price summary and trust panel

On mobile:
- summary moves below active form section or sticky bottom summary CTA

### 4. Quote Form - Section A Address
Fields:
- postcode
- address line 1
- address line 2
- city

Support note:
- London service area only at launch

### 5. Quote Form - Section B Property Details
Fields:
- property type
- number of bedrooms
- number of bathrooms
- estimated hours

Guidance:
- short help text to reduce confusion on choosing hours

### 6. Quote Form - Section C Service Details
Fields:
- service type
- preferred date
- preferred time
- one-off or recurring
- recurring frequency if applicable
- customer provides supplies yes/no

### 7. Quote Form - Section D Add-ons
Options:
- oven
- fridge
- inside windows
- ironing
- eco products
- additional requests text area

Goal:
- make upsells clear, not hidden

### 8. Quote Form - Section E Access Notes
Fields:
- pets yes/no
- entry notes
- parking notes

Purpose:
- better matching and fewer job issues later

### 9. Sticky Quote Summary Panel
Purpose:
- keep pricing visible and reduce checkout uncertainty

Sections:
- base service amount
- add-ons amount
- surcharge amount
- total estimate
- brief notes on supplies and service type impact
- CTA: Continue to Booking

Trust content in side panel:
- secure payment with Stripe
- cleaner verification process
- customer support available

### 10. Pricing Transparency Block
Purpose:
- reassure customer before payment

Content:
- rates vary by service type and supplies
- add-ons listed clearly
- urgent, weekend, or special requests may affect pricing
- end of tenancy may require manual quote

### 11. Why Customers Trust AreaSorted
Purpose:
- boost conversion if user scrolls for reassurance

Content:
- cleaners are verified before activation
- bookings are managed online
- secure payments
- support if a cleaner cancels

### 12. Booking Policy Summary
Purpose:
- key policy points before checkout

Must include short summary of:
- one reschedule allowed if at least 48 hours before start
- cancellation terms subject to timing
- cleaner cancellations are managed operationally
- refunds handled according to policy

Link to:
- Terms & Conditions
- Privacy Policy

### 13. FAQ Block
Suggested questions:
- Are cleaners verified?
- Do I need to provide cleaning supplies?
- How is the price calculated?
- What if I need to reschedule?
- What if my cleaner cancels?
- Is payment secure?

### 14. Support Contact Block
Purpose:
- reduce abandonment at the point of payment hesitation

Include:
- support email
- phone number
- support hours
- note that customers can contact the team before booking if unsure

### 15. Footer
Must include:
- Contact Us
- Services
- Pricing
- FAQ
- Terms & Conditions
- Privacy Policy
- GDPR Policy
- Cookie Policy
- Sitemap
- Become a Cleaner

## Design Rules

- this page should feel highly usable, not decorative for the sake of it
- form clarity is more important than visual experimentation
- price summary must feel stable and trustworthy
- key policy notes should be visible before checkout

## UX Rules

- validate fields clearly
- do not hide price changes unexpectedly
- update summary in real time where possible
- keep CTA state obvious
- support both guest quote flow and account-assisted flow later

## Mobile Rules

- split long form into clear sections
- keep price summary visible or quickly accessible
- CTA should remain easy to tap
- avoid overwhelming the user with too many fields at once

## Success Criteria

The page is successful when a customer can quickly understand:
- whether the service covers their address
- what affects the price
- whether cleaners are trustworthy
- what happens if plans change
- how to continue safely to booking and payment
