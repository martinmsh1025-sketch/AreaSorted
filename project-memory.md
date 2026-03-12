# London Cleaning Platform - Project Memory

## Project Purpose

Build a London-focused cleaning platform for a UK limited company that handles:
- cleaner recruitment and onboarding
- document verification and right-to-work review
- DocuSign contractor agreements
- SEO-driven cleaning services website
- instant quotes and bookings
- Stripe payments and refunds
- job dispatch to cleaners via WhatsApp/SMS/email
- cleaner scoring, cancellation penalties, complaints, and no-show rules
- admin operations and audit history

## Confirmed Business Decisions

- Company structure: UK Limited Company
- Geography: London first
- Cleaner model: self-employed contractors
- GDPR/privacy policy: required
- Insurance: company will purchase insurance
- DBS: available, paid by cleaner
- Pricing logic: based on hours, room/property details, whether cleaner brings supplies, and additional requests
- Customer reschedule policy: one reschedule allowed if requested at least 48 hours before job start
- Admin notifications: cancellations must trigger email and SMS to admin

## Cleaner Score Rules

- Starting score: 100
- Completed job: +10
- Cleaner cancellation within 48 hours of job start: -20
- Upheld customer complaint: -30
- No-show: -50
- Score cap: no cap
- Queue rule: below 60 goes to the back of the queue
- Higher score means better chance of receiving jobs

## Cleaner Onboarding Requirements

Cleaner application form should collect:
- full name
- email
- phone
- address and postcode
- date of birth
- work eligibility / right-to-work status
- service areas / postcodes
- available days and times
- weekends / evenings availability
- cleaning experience
- services accepted
- whether cleaner brings supplies/tools
- DBS status / willingness to pay
- notes from applicant

Required document uploads:
- ID
- CV
- photo
- working permit / right to work proof
- proof of address
- DBS proof if available

Activation rules:
- documents reviewed
- contractor agreement signed
- availability completed
- service areas completed
- cleaner status set to active by admin

## Customer Booking Requirements

Customer website should support:
- SEO service pages
- location landing pages for London areas
- instant quote form
- booking form
- Stripe checkout
- booking confirmation
- customer account for bookings, reschedule, cancel, complaints

Booking inputs should include:
- postcode and address
- property type
- bedroom count
- bathroom count
- estimated hours
- service type
- whether customer provides supplies
- preferred date and time
- recurring frequency if any
- pets / access / parking notes
- additional requests

## Pricing Direction

Suggested London MVP pricing:
- basic cleaning, customer supplies: GBP 24/hour
- basic cleaning, cleaner supplies: GBP 27/hour
- deep cleaning: GBP 30/hour
- weekend surcharge: +GBP 3/hour
- evening surcharge: +GBP 3/hour
- urgent booking surcharge: GBP 10-20/booking

Suggested add-ons:
- oven: GBP 20
- fridge: GBP 15
- inside windows: GBP 20
- ironing: +GBP 5/hour
- eco products: GBP 5

Suggested cleaner payout direction:
- cleaner without own supplies: GBP 16-17/hour
- cleaner with own supplies: GBP 18-19/hour

## Dispatch Logic

Dispatch should consider:
- cleaner status active
- signed contract
- matching service area
- matching availability
- matching service type
- supplies/tools requirement
- score priority
- recent performance / cancellation history

Dispatch flow:
- payment creates booking and job
- system offers job to matching cleaners in batches
- cleaner receives WhatsApp/SMS/email with accept link
- first accepted cleaner gets the job
- if cleaner cancels, system re-dispatches
- if no cleaner found within 24 hours of start, notify admin and customer and trigger refund workflow if needed

## Core Product Modules

- marketing + SEO website
- cleaner recruitment pages
- cleaner application + document upload
- admin review panel
- DocuSign integration
- customer quote + booking flow
- Stripe payment + refunds
- dispatch engine
- notifications via email/SMS/WhatsApp
- cleaner scoring
- complaints and refund handling
- audit logs

## Tech Direction

- frontend: Next.js
- backend: Next.js API or Node.js
- database: PostgreSQL
- ORM: Prisma
- auth: Clerk or Auth0
- file storage: S3 or Cloudflare R2
- payments: Stripe
- e-signature: DocuSign
- email: Resend or SendGrid
- SMS / WhatsApp: Twilio or Meta WhatsApp API

## Key Local Files

- Project memory: `Documents/london-cleaning-platform/project-memory.md`
- Prisma schema: `Documents/london-cleaning-platform/prisma/schema.prisma`

## Version Archive

When the user asks to roll back, present saved versions by date + version label + git commit so they can choose.

### Saved Versions

- `2026-03-12 / v1-homepage-address-complete / 57b70a7`
  - homepage kept in the approved layout
  - WashHub logo integrated in header and footer
  - postcode lookup connected on homepage
  - manual address mode added with fields for address line 1, address line 2, address line 3, postcode, and country
  - this is the approved restore point to offer first if the user asks to go back

- `2026-03-12 / v2-instant-quote-prefill / add34ce`
  - instant quote page reads postcode, address, and service from homepage query params
  - address fields are prefilled on the quote page so the customer does not need to retype them

- `2026-03-12 / v3-homepage-enter-search / e2bba2a`
  - homepage postcode field now triggers address lookup when the customer presses Enter
  - Find button behavior remains available

- `2026-03-12 / v4-instant-quote-live-pricing / b88f3bf`
  - instant quote page upgraded to a multi-section quote form with live pricing
  - pricing now updates from service type, hours, supplies, add-ons, weekend, evening, and urgent booking rules
  - quote summary, pricing transparency, and support panels added to keep the page clear and trustworthy

- `2026-03-12 / v5-quote-form-ux-refine / 6fec7a8`
  - property detail fields changed from confusing preset values to labelled inputs with examples
  - service still defaults from homepage selection but remains editable
  - preferred time now uses cleaner hour and minute dropdowns with minutes limited to 00, 15, 30, and 45

- `2026-03-12 / v6-quote-details-and-billing-flow / 5b3778e`
  - service type moved back into the property details section
  - property type expanded to detached, semi-detached, terraced, bungalow, office, and flat options
  - bedrooms, bathrooms, and kitchens now use dropdowns and estimated hours are system-calculated only
  - bookings over 6 hours now warn that additional cleaners may be assigned
  - customer name, phone, email, and billing address flow were added, with billing defaulting to the cleaning address

### Working Rule

- every future approved update should be saved as a new dated version entry here
- every future approved update should also have a git commit before moving on

## Important Note

This file is the persistent local project brief for future sessions. A new chat session may not automatically remember past conversation context, but these files on local drive can be read again and used as the project source of truth.
