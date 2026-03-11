# London Cleaning Platform - Sitemap And URL Structure v1

## Goals

- support SEO for London cleaning searches
- support trust for cleaner recruitment traffic from Indeed
- keep URLs clean, scalable, and easy to manage in Next.js

## Top-Level Route Structure

- `/`
- `/about`
- `/services`
- `/pricing`
- `/instant-quote`
- `/book`
- `/booking/confirmation`
- `/faq`
- `/contact`
- `/become-a-cleaner`
- `/cleaner/apply`
- `/cleaner/application-submitted`
- `/cleaner/login`
- `/customer/login`
- `/privacy-policy`
- `/gdpr-policy`
- `/terms-and-conditions`
- `/cookie-policy`
- `/cleaner-terms`

## Service Pages

- `/services/regular-cleaning`
- `/services/deep-cleaning`
- `/services/office-cleaning`
- `/services/airbnb-turnover`
- `/services/end-of-tenancy`

Rule:
- keep service pages under `/services/` for clarity and grouping

## Customer Account Routes

- `/account`
- `/account/bookings`
- `/account/bookings/[bookingReference]`
- `/account/bookings/[bookingReference]/reschedule`
- `/account/bookings/[bookingReference]/cancel`
- `/account/bookings/[bookingReference]/complaint`
- `/account/profile`

## Cleaner Portal Routes

- `/cleaner/dashboard`
- `/cleaner/profile`
- `/cleaner/availability`
- `/cleaner/service-areas`
- `/cleaner/documents`
- `/cleaner/contracts`
- `/cleaner/jobs`
- `/cleaner/jobs/[jobReference]`
- `/cleaner/score`
- `/cleaner/support`

## Cleaner Public Routes

- `/become-a-cleaner`
- `/cleaner/apply`
- `/cleaner/application-submitted`
- `/cleaner/faq`

## SEO Location Pages

Recommended pattern:
- `/areas/[locationSlug]`

Examples:
- `/areas/camden`
- `/areas/islington`
- `/areas/chelsea`

Purpose:
- local area overview pages that can link into service pages and quote flow

## SEO Service + Location Pages

Recommended pattern:
- `/areas/[locationSlug]/[serviceSlug]`

Examples:
- `/areas/camden/regular-cleaning`
- `/areas/islington/deep-cleaning`
- `/areas/chelsea/domestic-cleaning`

Purpose:
- high-intent local SEO pages
- strong long-tail keyword targeting

## Recruitment SEO Pages

Recommended pattern:
- `/cleaner-jobs`
- `/cleaner-jobs/[locationSlug]`

Examples:
- `/cleaner-jobs/london`
- `/cleaner-jobs/camden`

Purpose:
- support Indeed credibility and organic recruitment traffic

## Blog / Advice Section

Optional but recommended:
- `/blog`
- `/blog/[slug]`

Use later for:
- cleaning tips
- moving-out cleaning guides
- London area cleaning advice
- cleaner recruitment advice

## Admin Routes

Keep admin isolated:
- `/admin`
- `/admin/dashboard`
- `/admin/cleaners`
- `/admin/cleaners/[id]`
- `/admin/verification`
- `/admin/contracts`
- `/admin/customers`
- `/admin/bookings`
- `/admin/bookings/[id]`
- `/admin/dispatch`
- `/admin/payments`
- `/admin/refunds`
- `/admin/complaints`
- `/admin/notifications`
- `/admin/content`
- `/admin/settings`
- `/admin/audit-logs`

## URL Rules

- use lowercase only
- use hyphens, not underscores
- avoid dates in evergreen SEO pages
- keep one canonical URL per content target
- use booking and job public references in private customer/cleaner routes where useful
- avoid exposing raw internal database IDs on public-facing pages when possible

## Canonical SEO Structure

Recommended canonical targets:
- broad service keyword pages canonically point to `/services/...`
- area-specific service pages self-canonical if they have unique content
- location overview pages self-canonical

## Sitemap Groups

### Core Static Pages
- home
- about
- pricing
- faq
- contact
- legal pages

### Service Pages
- all `/services/...`

### Area Pages
- all `/areas/[locationSlug]`
- all `/areas/[locationSlug]/[serviceSlug]`

### Recruitment Pages
- `/become-a-cleaner`
- `/cleaner/apply`
- `/cleaner/faq`
- `/cleaner-jobs/...`

### Blog Pages
- `/blog`
- `/blog/[slug]`

Exclude from sitemap:
- account pages
- cleaner dashboard pages
- admin pages
- booking confirmation pages

## Launch Priority URLs

Must have at launch:
- `/`
- `/about`
- `/services`
- `/services/regular-cleaning`
- `/services/deep-cleaning`
- `/pricing`
- `/instant-quote`
- `/faq`
- `/contact`
- `/become-a-cleaner`
- `/cleaner/apply`
- `/privacy-policy`
- `/gdpr-policy`
- `/terms-and-conditions`

Strongly recommended at launch:
- `/cleaner/faq`
- `/cleaner-terms`
- `/areas/camden`
- `/areas/islington`
- `/areas/chelsea`
- `/areas/camden/regular-cleaning`
- `/areas/islington/deep-cleaning`
- `/cleaner-jobs/london`

## Internal Linking Rules

- home links to quote flow, cleaner application, and main service pages
- every service page links to instant quote and area pages
- every area page links to relevant service pages and quote flow
- cleaner recruitment pages link to apply page and cleaner FAQ
- footer links all legal and trust pages

## Next.js Routing Recommendation

Recommended app router structure:

```text
app/
  page.tsx
  about/page.tsx
  services/page.tsx
  services/[serviceSlug]/page.tsx
  pricing/page.tsx
  instant-quote/page.tsx
  book/page.tsx
  booking/confirmation/page.tsx
  faq/page.tsx
  contact/page.tsx
  become-a-cleaner/page.tsx
  cleaner/
    apply/page.tsx
    application-submitted/page.tsx
    faq/page.tsx
    login/page.tsx
    dashboard/page.tsx
    profile/page.tsx
    availability/page.tsx
    service-areas/page.tsx
    documents/page.tsx
    contracts/page.tsx
    jobs/page.tsx
    jobs/[jobReference]/page.tsx
    score/page.tsx
    support/page.tsx
  account/
    login/page.tsx
    page.tsx
    bookings/page.tsx
    bookings/[bookingReference]/page.tsx
    bookings/[bookingReference]/reschedule/page.tsx
    bookings/[bookingReference]/cancel/page.tsx
    bookings/[bookingReference]/complaint/page.tsx
    profile/page.tsx
  areas/
    [locationSlug]/page.tsx
    [locationSlug]/[serviceSlug]/page.tsx
  cleaner-jobs/
    page.tsx
    [locationSlug]/page.tsx
  privacy-policy/page.tsx
  gdpr-policy/page.tsx
  terms-and-conditions/page.tsx
  cookie-policy/page.tsx
  cleaner-terms/page.tsx
  admin/
    dashboard/page.tsx
    cleaners/page.tsx
    cleaners/[id]/page.tsx
    verification/page.tsx
    contracts/page.tsx
    customers/page.tsx
    bookings/page.tsx
    bookings/[id]/page.tsx
    dispatch/page.tsx
    payments/page.tsx
    refunds/page.tsx
    complaints/page.tsx
    notifications/page.tsx
    content/page.tsx
    settings/page.tsx
    audit-logs/page.tsx
```

## Notes For Launch

- public routes should use SEO-friendly slugs and metadata
- private routes should prioritize security and usability over SEO
- do not let thin duplicate area pages go live; each should have distinct content
- recruitment pages should feel as trustworthy as customer pages because they support Indeed conversion
