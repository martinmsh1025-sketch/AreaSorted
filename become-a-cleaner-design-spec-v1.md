# AreaSorted - Become a Cleaner Design Spec v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Legacy brand names (`WashHub`, `Alder London`) have been removed from all source code and data files. `AreaSorted` is the sole active brand.


## Purpose

This page must convince job applicants from Indeed and other recruitment sources that:
- the business is real
- the onboarding process is legitimate
- document upload is normal and secure
- the self-employed model is clearly explained
- applying is worth their time

This page is both a conversion page and a trust page.

## Core Goals

- turn visitors into cleaner applicants
- reduce scam concerns
- explain the onboarding process clearly
- explain self-employed contractor setup simply
- explain what documents are needed before the user reaches the form

## Page Structure

### 1. Header
- same global header as homepage
- navigation should still include customer links and legal/support links
- primary CTA can remain `Get Instant Quote`
- secondary CTA should be `Start Application`

### 2. Hero Section
Purpose:
- immediately explain the cleaner opportunity

Content:
- headline focused on self-employed cleaner work in London
- supporting copy on flexible work, structured onboarding, and verified jobs
- trust bullets:
  - flexible schedule
  - London-based opportunities
  - secure onboarding process
  - contract issued via DocuSign

CTAs:
- Start Cleaner Application
- Contact Recruitment Support

Right-side panel:
- quick trust card with:
  - required documents summary
  - onboarding steps count
  - company support message

### 3. Why Work With AreaSorted
Purpose:
- show value beyond just “job board ad”

Content blocks:
- flexible work based on availability
- London-focused demand
- structured onboarding and operations
- score-based priority system for reliable cleaners

### 4. How The Application Process Works
Purpose:
- remove uncertainty before the applicant starts

Four-step structure:
- complete your application
- upload your documents
- admin review and verification
- receive contract and start accepting jobs

Each step should include 1-2 short lines only.

### 5. What You Need To Apply
Purpose:
- set expectations early

Required list:
- ID
- CV
- recent photo
- right-to-work proof
- proof of address

Conditional / optional:
- DBS if available
- DBS may be requested for some work
- cleaner pays for DBS if required

### 6. Self-Employed Model Explained
Purpose:
- very important trust and legal clarity section

Content:
- cleaners join as self-employed contractors
- cleaners set their own availability
- cleaners are responsible for their own tax affairs
- jobs are offered based on availability, location, and score
- accepted jobs are expected to be completed professionally

Tone:
- clear and respectful
- not overly legalistic on-page
- link to Cleaner Terms for full wording

### 7. Documents And Verification Trust Section
Purpose:
- directly answer “why are you asking for my documents?”

Content:
- explanation of why ID and right-to-work proof are required
- note that uploaded files are reviewed securely
- explanation that verification helps protect customers and cleaners
- mention privacy and GDPR pages

This section should visually feel reassuring and serious.

### 8. Score And Reliability Summary
Purpose:
- explain the dispatch system simply before sign-up

Content:
- starting score: 100
- completed jobs: +10
- cancellation within 48 hours: -20
- upheld complaint: -30
- no-show: -50
- below 60: placed at back of queue
- higher scores improve job priority

This should be a plain explanation block, not too punitive in tone.

### 9. Availability And Areas Section
Purpose:
- prepare applicant for what information they will need to provide

Content:
- weekly availability will be required
- cleaners should set service areas / postcodes
- own supplies and equipment status should be stated
- weekend/evening availability can increase matching opportunities

### 10. Cleaner FAQ
Purpose:
- reduce drop-off before application form

Suggested questions:
- Do I need cleaning experience?
- Do I need my own cleaning supplies?
- How do I receive jobs?
- Do I need DBS?
- How does the score system work?
- What happens if I cancel a job?
- How do I know this company is genuine?

### 11. Recruitment Contact Block
Purpose:
- increase trust and reduce abandonment

Must include:
- recruitment support email
- phone number if available
- support hours
- note that applicants can contact the company with onboarding questions

### 12. Final Application CTA Section
Purpose:
- give a clean final conversion moment

CTA:
- Start Cleaner Application

Secondary link:
- Read Cleaner Terms

### 13. Footer
Must include:
- Contact Us
- Terms & Conditions
- Privacy Policy
- GDPR Policy
- Cookie Policy
- Cleaner Terms
- FAQ
- Sitemap
- About Us

## Design Rules

- this page must feel calmer and more reassuring than a recruitment ad
- avoid overly salesy language
- use stronger trust styling around document upload and contract process
- the page should feel professional enough that uploading ID seems reasonable

## Visual Emphasis Areas

- hero trust panel
- document verification explanation
- self-employed explanation
- scoring summary
- recruitment support details

## Mobile Rules

- keep Start Application visible early
- keep trust bullets above the fold
- break long explanatory sections into short blocks
- FAQ must be easy to scan
- legal/support links must remain visible in footer

## Success Criteria

The page is successful when a visitor can quickly understand:
- who the company is
- what type of cleaner work is offered
- what documents are required
- why those documents are needed
- how the self-employed model works
- how jobs are assigned
- how to contact the company if unsure
## Scope Status

- This page is secondary or legacy workforce-acquisition scope
- It should not be treated as the primary public conversion path over customer booking or provider-company onboarding
