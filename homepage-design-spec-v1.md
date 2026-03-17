# AreaSorted - Homepage Design Spec v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Where this document still references older names such as `WashHub`, `Alder London`, or `London Cleaning Platform`, treat them as legacy wording pending full content rewrite; `AreaSorted` is the active brand.


## Purpose

The homepage must act as:
- the main customer conversion page
- the main trust page for the brand and prospective provider partners
- the main brand page for SEO and legitimacy

It must not only look good. It must also prove the company is real, contactable, and professionally run.

## Brand To Use

- Brand: `AreaSorted`
- Descriptor: `Trusted local services across London`

## Core Homepage Goals

- get customers into the quote flow
- make cleaners trust the company enough to apply
- explain how the service works
- show legal and operational credibility
- expose all essential support and policy links

## Page Structure

### 1. Announcement / Utility Bar
Purpose:
- quick trust signal and operational message

Content ideas:
- London domestic cleaning and flexible cleaner opportunities
- verified cleaners, secure booking, support available

### 2. Header
Left:
- logo wordmark

Center / right navigation:
- Home
- Services
- Pricing
- Instant Quote
- Become a Cleaner
- FAQ
- Contact Us

Primary CTA:
- Get Instant Quote

Secondary CTA:
- Apply as Cleaner

Behavior:
- sticky on scroll
- simplified mobile menu

### 3. Hero Section
Purpose:
- immediate understanding and conversion

Layout:
- left content block
- right quote card or structured booking teaser

Left content:
- H1 headline
- supporting paragraph
- trust bullets
- two CTAs

Suggested content direction:
- headline about trusted London cleaning with verified professionals
- support copy mentioning easy booking, secure payment, and professional onboarding

Trust bullets:
- verified cleaners
- simple online booking
- secure Stripe payments
- London coverage

CTAs:
- Get Instant Quote
- Become a Cleaner

Right panel:
- mini quote form
  - postcode
  - service type
  - date
  - supplies yes/no
  - CTA button

Visual rules:
- calm premium feel
- not cluttered
- strong spacing

### 4. Trust Bar
Purpose:
- immediate legitimacy after hero

Items:
- verified cleaner onboarding
- secure online payments
- London-focused service
- customer support
- flexible bookings

### 5. How It Works
Purpose:
- remove friction for customer conversion

Three-step structure:
- enter your postcode and service needs
- receive your quote and book online
- get matched with a verified cleaner

Optional note:
- if a cleaner cancels, the system reassigns where possible

### 6. Services Overview
Purpose:
- show breadth of offer and support SEO navigation

Cards:
- Regular Cleaning
- Deep Cleaning
- Office Cleaning
- Airbnb Turnover
- End of Tenancy Enquiry

Each card includes:
- short description
- link to service page

### 7. Pricing Snapshot
Purpose:
- reassure users that pricing is transparent

Content:
- base hourly rate overview
- cleaner supplies vs customer supplies note
- deep cleaning note
- add-ons examples
- link to full pricing page

### 8. Why Choose AreaSorted
Purpose:
- position the business above cheap or unreliable operators

Content blocks:
- verified cleaner onboarding
- simple online booking and secure payment
- reliable dispatch and cancellation handling
- support team available if issues happen

### 9. Cleaner Recruitment Section
Purpose:
- very important for Indeed and recruitment traffic

Headline direction:
- become a self-employed cleaner in London

Content:
- flexible work opportunities
- onboarding through document checks and contract signing
- set your availability and service areas
- score-based priority system explained lightly

CTA:
- Start Cleaner Application

Trust content:
- what documents are needed
- why verification is required
- contact recruitment support

### 10. Cleaner Onboarding Trust Section
Purpose:
- reduce scam fear from applicants

Content:
- how application review works
- what documents are required
- contract sent by DocuSign
- self-employed contractor explanation
- DBS can be required and paid by cleaner

This should be a distinct section, not hidden inside FAQ.

### 11. Areas We Cover
Purpose:
- local trust and SEO support

Content:
- London coverage summary
- sample area list such as Camden, Islington, Chelsea
- link to area pages
- note that more areas may be added over time

### 12. Testimonials / Social Proof
Purpose:
- improve conversion credibility

Early launch approach:
- if no real testimonials yet, use placeholder layout but do not invent fake reviews
- can replace with trust statements or process reassurance until reviews exist

### 13. FAQ Preview
Purpose:
- reduce objections on homepage itself

Suggested homepage FAQ topics:
- how pricing works
- whether cleaners are verified
- whether customers need to provide supplies
- what happens if a cleaner cancels
- how to become a cleaner
- whether London-only at launch

### 14. Contact / Company Block
Purpose:
- make business feel real and reachable

Must include:
- company / brand name
- customer support email
- recruitment email if separate
- phone number
- operating/support hours
- registered office or business location note if appropriate
- London service statement

Later add when available:
- company registration number
- VAT number if applicable

### 15. Final CTA Section
Purpose:
- one last conversion opportunity before footer

Split CTA:
- Book a cleaning service
- Join as a cleaner

### 16. Full Footer
Purpose:
- essential legal, trust, and navigation layer

Footer columns recommended:

Column 1 - Brand
- AreaSorted
- short company description
- support email
- phone

Column 2 - Customer Links
- Services
- Pricing
- Instant Quote
- FAQ
- Contact Us

Column 3 - Cleaner Links
- Become a Cleaner
- Cleaner Application
- Cleaner FAQ
- Cleaner Terms

Column 4 - Legal Links
- Terms & Conditions
- Privacy Policy
- GDPR Policy
- Cookie Policy

Column 5 - Sitemap / Explore
- About Us
- Areas We Cover
- Site Map
- London service pages

Footer bottom row:
- copyright
- brand name
- company number placeholder area
- all rights reserved

## Essential Pages Linked From Homepage

The homepage must expose or link clearly to:
- Services
- Pricing
- Instant Quote
- Become a Cleaner
- Contact Us
- FAQ
- About Us
- Terms & Conditions
- Privacy Policy
- GDPR Policy
- Cookie Policy
- Sitemap
- Areas We Cover
- Cleaner Terms

## Items That Must Not Be Missed

- full legal footer
- visible contact details
- explanation of cleaner verification
- explanation of cleaner application process
- area coverage block
- trust signals around payment and onboarding
- dual-path CTA for customers and cleaners

## Design Rules

- keep premium local service feel
- avoid looking like a generic booking app
- avoid too many boxed sections stacked the same way
- use strong typography and calm spacing
- footer should feel substantial, not minimal

## Mobile Rules

- header CTA stays accessible
- quote CTA appears early
- cleaner CTA remains visible but secondary
- footer keeps legal and contact links easy to tap
- long sections collapse cleanly without feeling empty

## Homepage Success Criteria

The homepage is successful when a new visitor can quickly understand:
- what the company does
- where it operates
- how to book
- how cleaners are vetted
- how to apply as a cleaner
- how to contact the business
- where to find policies and site links

## Recommended Build Priority Inside Homepage

1. header and hero
2. trust bar and how it works
3. services and pricing snapshot
4. cleaner recruitment and onboarding trust block
5. areas covered and FAQ
6. contact/company block
7. full footer with legal and sitemap links
