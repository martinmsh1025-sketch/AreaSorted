# AreaSorted Session Summary (2026-04-07)

## Web Launch Readiness Snapshot

- Practical functional completion is roughly `85-90%`
- Soft launch / internal-use readiness is roughly `80%`
- Public production launch readiness is roughly `65-75%`

## Priority Launch Checklist

### P0 - Must resolve before public launch
- Finalize legal/compliance documents and business review:
  - `src/content/legal/customer-terms.txt`
  - `src/content/legal/refund-policy.txt`
  - `src/content/legal/gdpr-policy.txt`
  - `src/content/legal/cookie-policy.txt`
  - `src/app/(marketing)/cleaner-terms/page.tsx`
- Review public booking/account access boundaries and remove any sensitive customer data exposure via public references
- End-to-end verify payment flow:
  - quote
  - checkout / temporary card hold
  - provider accept -> capture
  - customer cancel / refund paths
  - payout hold / release paths
- Complete production environment setup:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXT_PUBLIC_CRISP_WEBSITE_ID`
  - `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL`
  - production `DATABASE_URL` / `DIRECT_URL`

### P1 - Strongly recommended before launch
- Add test coverage / smoke coverage for customer booking, provider accept/reject, admin refunds/payouts, webhook flows, and cron flows
- Add monitoring and runbooks for:
  - Stripe/webhook failures
  - cron failures
  - support escalation
  - production error tracking
- Final pass on content, support contact details, email templates, and empty states

### P2 - Cleanup / hardening
- Remove temporary file-based pricing storage
- Reduce legacy cleaner-path dependency in current booking/payment flow
- Freeze and clean the worktree before release

## Area Scores

- Customer web: `8/10`
- Provider web: `8.5/10`
- Admin web: `8/10`
- Payment/Finance: `7/10`
- Legal/Compliance: `4/10`
- Infra/Deploy: `7.5/10`

## Highest-Risk Customer Flow Issues Identified

1. Public booking manage page may expose customer personal data by reference lookup:
   - `src/app/booking/manage/page.tsx`
2. Customer self-reschedule flow does not clearly re-check provider availability/pricing constraints before applying the new slot:
   - `src/app/account/bookings/[reference]/actions.ts`
3. Customer cancel / refund path is materially complex and still needs real Stripe edge-case testing:
   - race with provider accept
   - capture/refund transitions
   - `REFUND_PENDING` fallback behavior
4. Quote / booking status pages are reference-based and should be reviewed carefully for public-share / brute-force / privacy assumptions:
   - `src/app/quote/[reference]/page.tsx`
   - `src/app/booking/status/[reference]/page.tsx`
5. In-memory rate limiting is acceptable for single-instance development but is not ideal for multi-instance production:
   - `src/lib/security/rate-limit.ts`

## Current Worktree Direction

- Current uncommitted work is primarily focused on the provider mobile app and mobile provider APIs
- Web customer core is not currently undergoing a major unfinished redesign
- Tracked web-side changes are mostly small support changes for shared provider order logic and type/config fixes

## Recommended Next Priorities

1. Fix public booking manage privacy/access issue first
2. Re-validate customer reschedule and cancel/payment edge cases
3. Complete legal/compliance pass
4. Activate production environment keys and deployment settings
5. Add launch-critical tests and monitoring
