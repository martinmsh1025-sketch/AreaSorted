# AreaSorted dispute and payout policy

Status: draft v1

This policy is intended to support a higher-trust marketplace model by protecting both customers and providers.

## Core principles

- Customers should have a clear and fair window to report service issues.
- Providers should not face open-ended payment uncertainty after completing a job properly.
- Payout deductions should be proportionate to the issue severity.
- Severe misconduct, fraud, property damage, or chargebacks are handled separately and may override normal payout timing.

## Standard complaint window

- A customer should normally report service quality issues within `48 hours` of job completion.
- If no complaint is submitted within `48 hours`, the booking is treated as accepted for normal quality purposes.
- After that point, the provider payout should become eligible for release, subject to fraud checks, payment disputes, chargebacks, or legal/compliance holds.

## Standard payout timing

- A booking is marked complete by the provider or admin.
- A `48-hour review window` then starts.
- If no complaint is logged during that period, the payout moves from hold to eligible.
- AreaSorted should aim to pay the provider within `5 working days` after the booking is marked complete, assuming there is no valid hold reason.

## What happens if a complaint is raised in time

- If a complaint is raised within the `48-hour` window, the payout for that booking may be placed on hold while the case is reviewed.
- AreaSorted should review the case using:
  - booking notes
  - timeline/status events
  - messages/support tickets
  - uploaded evidence
  - provider response
- The platform should aim to give an initial case update within `1 business day` and a review outcome within `1-2 business days` where possible.

## Recommended deduction framework

Do not use one flat maximum deduction for every issue. Use severity bands.

### 1. Minor service issue

Examples:
- small missed task
- minor lateness where service is still completed properly
- minor quality issue not requiring a revisit

Recommended outcome:
- customer credit or partial goodwill adjustment
- provider deduction up to the lower of:
  - `10-15%` of provider payout, or
  - `GBP 25`

### 2. Moderate service issue

Examples:
- meaningful missed tasks
- poor quality requiring partial refund
- provider lateness causing material inconvenience
- rework needed but no serious misconduct

Recommended outcome:
- partial refund or no-cost revisit
- provider deduction up to the lower of:
  - `25-50%` of provider payout, or
  - the direct customer refund / rework cost attributable to the issue

### 3. Severe failure

Examples:
- no-show
- job materially not done
- serious quality failure
- unprofessional or abusive behaviour
- clear breach of platform rules

Recommended outcome:
- customer full or near-full refund
- provider payout may be reduced by up to `100%`
- account may be restricted or suspended

### 4. Damage, fraud, safety, or chargeback

Examples:
- property damage
- theft or suspected fraud
- unsafe conduct
- card dispute / chargeback

Recommended outcome:
- payout may be fully held
- provider payout may be reduced up to `100%`
- additional recovery from future payouts may be allowed where contractually permitted
- account may be suspended pending investigation

## Important guardrails

- For normal quality complaints, deductions should generally not exceed the amount reasonably connected to the customer remedy.
- AreaSorted should avoid arbitrary deductions without a recorded rationale.
- Every deduction should have an internal note explaining:
  - issue type
  - evidence reviewed
  - customer remedy
  - provider impact

## Late complaints

- Complaints raised after `48 hours` may still be reviewed, but they should not automatically block payout.
- Late complaints should normally require stronger supporting evidence.
- After the 48-hour window, the default position should be that the provider payout proceeds unless there is evidence of serious misconduct, fraud, damage, or payment dispute risk.

## Provider protection

- Providers should be able to respond to complaints before major deductions are finalised, except in obvious no-show, fraud, or safety cases.
- Providers should see when a payout is on hold and, at minimum, the high-level reason category.
- Providers should receive a fair review note if a complaint is upheld and money is deducted.

## Customer protection

- Customers should be told clearly how long they have to report issues.
- Customers should be able to upload photos or PDFs as evidence.
- Customers should be able to see complaint status and review notes in their account.

## Recommended operating rule for launch

For launch, use this default policy:

- `48 hours` to report standard quality issues
- no complaint within `48 hours` = payout eligible
- minor issue = up to `15%` deduction, cap `GBP 25`
- moderate issue = up to `50%` deduction, capped by actual remedy cost
- severe issue / no-show / damage / fraud = up to `100%` deduction
- chargebacks may be recovered outside the 48-hour rule

## Commercial note

This policy should be reflected consistently across:

- provider agreement
- refund / complaint policy
- admin trust ops workflow
- payout rules in the provider portal
- customer-facing support and protection pages
