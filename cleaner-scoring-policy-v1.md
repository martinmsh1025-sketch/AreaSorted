# WashHub - Cleaner Scoring Policy v1

## Purpose

The cleaner score is an internal reliability engine.
It exists to improve dispatch quality, reduce cancellations, and reward reliable cleaners.

## Core Rule

- score affects job priority
- higher score = cleaner is more likely to receive suitable jobs first
- lower score = cleaner moves down the queue or may require admin review

## Who Can See The Score

- admin: full score and full score history
- cleaner: own score and own score history
- customer: should not see the raw internal score number

## Starting Score

- every newly activated cleaner starts at `100`

## Score Events

### Positive
- completed booking: `+10`

### Negative
- cleaner cancels within 48 hours of job start: `-20`
- upheld customer complaint: `-30`
- no-show: `-50`

## Queue Effect

- below `60`: cleaner moves to the back of the dispatch queue
- higher score increases dispatch priority
- no maximum score cap for now

## Recommended Future Additions

- late arrival over agreed threshold: optional penalty later
- repeated fast responses: optional reward later
- repeated no-issue completions: optional bonus later

## Important Safeguard

The score must only be based on objective work-related platform behaviour.

It must not use:
- age
- nationality
- gender
- race
- religion
- disability
- appearance
- accent
- any other protected characteristic

## Transparency To Cleaners

Cleaner portal should show:
- current score
- recent score changes
- reason for each change
- date of each change

Example entries:
- `+10 Completed booking`
- `-20 Cancelled within 48 hours`
- `-30 Complaint upheld`

## Admin Controls

- admin can review score history
- admin can manually adjust score only with internal note / audit log
- every manual change must be recorded

## Appeals / Review

Future direction:
- cleaners may request review of a score event
- admin can confirm, remove, or adjust a score event after review

## Dispatch Usage

Suggested dispatch order:
1. active cleaner
2. area match
3. time match
4. supplies / service fit
5. score priority
6. recent cancellation behaviour

## Customer View

Customers should not see the raw score.
Instead they should see trust labels derived from verified, objective platform data.
