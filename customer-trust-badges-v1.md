# AreaSorted - Customer Trust Badges v1

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Where this document still references older names such as `WashHub`, `Alder London`, or `London Cleaning Platform`, treat them as legacy wording pending full content rewrite; `AreaSorted` is the active brand.


## Purpose

Customers should see simple trust signals, not raw internal cleaner scores.

## Why

- internal scores are mainly for dispatch and operations
- customers may misunderstand raw platform scoring
- trust badges are easier to explain and safer to present

## Recommended Customer-Facing Badges

- `Verified by AreaSorted`
- `Reliable cleaner`
- `Experienced cleaner`
- `Low cancellation history`
- `Documents reviewed`

## Badge Sources

### Verified by AreaSorted
Use when:
- cleaner identity reviewed
- right-to-work reviewed
- required onboarding complete

### Reliable cleaner
Use when:
- cleaner score above internal threshold
- no recent serious cancellation or no-show issue

### Experienced cleaner
Use when:
- cleaner has sufficient completed jobs or approved experience history

### Low cancellation history
Use when:
- cancellation record stays below internal threshold

### Documents reviewed
Use when:
- required files uploaded and approved

## What Customers Should Not See

- raw internal score number
- internal penalty history
- operational risk flags
- subjective review notes

## Good Customer Display Examples

- `Verified by AreaSorted`
- `Reliable cleaner`
- `50+ completed jobs`
- `Excellent customer rating`

## Bad Customer Display Examples

- `Cleaner score: 72`
- `Cleaner score: 131`
- `Penalty history`

## Recommended Rule

- internal score drives dispatch
- customer sees simplified trust badges
- cleaner sees own score and score log
- admin sees full operational detail
## Scope Status

- This is a secondary trust-display document for workforce or fulfilment visibility
- It must not override the authoritative provider-company marketplace model
