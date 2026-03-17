# AreaSorted - Cleaner Onboarding Master Spec v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Where this document still references older names such as `WashHub`, `Alder London`, or `London Cleaning Platform`, treat them as legacy wording pending full content rewrite; `AreaSorted` is the active brand.


## Purpose

Cleaner onboarding is a core platform module.
It must be strong enough to support:
- trust from applicants arriving from Indeed and other recruitment channels
- legal and compliance review
- self-employed contractor workflow
- cleaner activation for future dispatch
- later cleaner app / web portal use

This module is more important than a cleaner jobs page on its own because dispatch quality depends on the quality of onboarding.

## Strategic Goal

Build a cleaner onboarding flow that:
- feels credible and professional
- collects the minimum required legal and operational data
- reduces HMRC / employment-status risk by matching the operating model to a self-employed structure
- prepares the cleaner for future web/app login and job acceptance

## Core Operating Principle

AreaSorted should not behave like a traditional employer if the intention is to keep workers genuinely self-employed within any retained workforce module.

This means the onboarding, contract, and day-to-day operations should support:
- cleaner-provided availability
- cleaner choice to accept / reject jobs
- no guaranteed hours
- no obligation to provide work
- no obligation to accept all work
- payment against completed jobs, not salary-like scheduling

## What Cleaner Onboarding Must Collect

### 1. Basic Identity
- cleaner ID
- full legal name
- preferred display name if needed later
- date of birth
- phone number
- email address
- home address
- home postcode
- nationality

### 2. Work Eligibility
- right-to-work status
- visa / permit status if applicable
- visa / permit expiry date if applicable
- passport or ID upload
- right-to-work evidence upload

### 3. Self-Employed Information
- whether already registered as self-employed
- UTR number (allow later completion if needed)
- NI number if legally needed and stored carefully
- bank account name
- bank sort code / account details (can be later step)
- tax responsibility declaration

### 4. Operational Matching Data
- service postcodes
- service region / coverage area
- travel radius
- transport mode
- whether cleaner brings supplies
- whether cleaner brings equipment
- service types accepted
- weekend availability
- evening availability
- weekly availability schedule
- blocked / unavailable dates

### 5. Quality And Trust Data
- profile photo
- CV
- years of cleaning experience
- references (optional)
- DBS status
- DBS upload if available
- optional 30-second intro video

### 6. Legal / Consent
- privacy policy acknowledgement
- GDPR / data processing consent
- contractor onboarding acknowledgement
- confirmation that details and documents are accurate
- contractor agreement acceptance through DocuSign

## Required Uploads

Must-have uploads:
- ID / passport
- photo
- CV
- right-to-work proof / permit / visa if applicable
- proof of address

Optional or conditional uploads:
- DBS certificate
- intro video up to 30 seconds

## Intro Video Guidance

Optional intro video should:
- be short, around 30 seconds
- help admin and future customers trust the cleaner more
- not be mandatory at launch

Suggested prompts:
- name
- areas they cover
- cleaning experience
- availability summary

## Cleaner Onboarding Web Flow

### Step 1 - Personal Details
- full name
- DOB
- email
- phone
- home address
- postcode

### Step 2 - Work Eligibility
- right-to-work questions
- nationality
- visa / permit questions
- upload related documents

### Step 3 - Work Preferences
- service types accepted
- own supplies yes/no
- own equipment yes/no
- travel method
- weekend / evening availability

### Step 4 - Areas And Times
- service postcode list
- service region / radius
- weekly availability grid
- unavailable dates

### Step 5 - Experience And Profile
- CV
- years of experience
- profile photo
- optional intro video
- optional references

### Step 6 - Legal And Contract
- self-employed declaration
- privacy / GDPR acknowledgement
- onboarding declaration
- DocuSign contractor agreement

### Step 7 - Submission Status
- application submitted
- under review
- need more info
- approved pending contract
- active

## Admin Review Requirements

Admin cleaner review page should show:
- identity details
- contact details
- service region
- availability
- own supplies / equipment
- documents
- photo
- intro video if provided
- right-to-work status
- DBS status
- contractor agreement status
- internal notes
- activation status

Admin actions:
- approve
- reject
- request more information
- mark contract sent
- activate cleaner
- suspend cleaner

## Cleaner Portal Requirements After Onboarding

Cleaner portal should eventually show:
- profile
- contact details
- service areas
- availability
- uploaded documents status
- contract status
- score
- jobs and earnings

## Customer-Facing Cleaner Data After Job Acceptance

After a cleaner accepts a job, customer-facing details may include:
- cleaner first name / display name
- cleaner profile photo
- cleaner contact phone if policy allows
- service appointment status

This should be policy-driven and privacy-aware.

## HMRC / Employment Status Risk Notes

Important: calling someone self-employed is not enough by itself.

Operational design should avoid creating a strong employee / worker impression through:
- fixed mandatory shifts imposed by platform
- obligation to accept every job
- guaranteed work volume
- too much day-to-day control over how work is done
- employer-style discipline unrelated to platform reliability standards

Risk reduction direction:
- cleaner provides own availability
- cleaner chooses whether to accept a job
- no guaranteed minimum work
- no guaranteed future work
- payment tied to completed jobs
- contract language matches operating model

## Legal / Policy Files Needed

- cleaner contractor agreement
- privacy policy
- GDPR policy
- right-to-work procedure
- cancellation and scoring policy
- DBS policy
- data retention / deletion policy

## Data Model Requirements

Cleaner profile model should support:
- identity
- contact
- postcode / region coverage
- weekly availability
- own supplies / equipment
- documents
- right-to-work
- DBS
- photo
- optional video
- contract status
- admin review status
- activation status

## Launch Priority

### Must Have
- personal details
- work eligibility
- document uploads
- service area
- weekly availability
- own supplies / equipment
- profile photo
- legal acknowledgements
- DocuSign contractor agreement
- admin review and activation

### Strongly Recommended
- DBS status
- optional intro video
- internal admin notes
- references field

### Later
- cleaner self-service document reupload history
- richer profile card for customer view
- mobile app onboarding parity

## Next Build Steps

1. update cleaner data model and booking record model where needed
2. build cleaner onboarding form pages
3. build admin cleaner review list and detail page
4. connect DocuSign contract state to onboarding
5. connect active cleaner records to dispatch
## Scope Status

- This is a secondary workforce onboarding specification
- It remains relevant only where AreaSorted retains direct cleaner or worker onboarding for fulfilment operations
- It must not override provider-company onboarding, provider auth, provider pricing, or provider portal decisions
