# AreaSorted Session Summary (2026-04-06)

## Core Project
- Project path: `/Users/piggypig/Documents/london-cleaning-platform`
- Backup created: `/Users/piggypig/Documents/london-cleaning-platform-backup-20260406-202018`
- Stack: Next.js 16, Prisma, Stripe, provider/customer/admin portals
- Current overall platform completion: ~`93%`
- Current engineering completion: ~`97%`

## Git / Deploy
- GitHub repo: `https://github.com/martinmsh1025-sketch/AreaSorted.git`
- Main branch in use: `main`
- Important rollback checkpoints:
  - `1377d83` - provider onboarding / review workflow checkpoint
  - `b4d8c32` - admin-controlled service category visibility checkpoint
- Latest pushed commit before this note: `5a25752`
- Vercel auto-deploys from `main` when linked project is configured correctly

## Production / Environment Keys Still Needed
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_CRISP_WEBSITE_ID`
- `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL`
- `DATABASE_URL` / `DIRECT_URL` on Vercel must point to the correct production DB

## Major Features Added / Updated In This Session

### Customer
- Quote flow can jump from homepage postcode search straight into later steps
- Full selected address is carried through the quote flow
- Customer support page is now a real support flow, not just a generic enquiry page
- Step-based quote wording improved to reduce misleading pricing signals
- Provider shortlist / selection groundwork added:
  - shortlist stored per quote
  - customer can choose provider option
  - shortlist shown on quote result page
  - later moved toward earlier selection in quote flow

### Provider
- Public provider apply flow added: `/provider/apply`
- Invite flow still exists and remains category-locked
- Sole trader vs company document requirements split
- DBS for sole traders changed to optional, with reminder messaging
- Right-to-work question added for sole traders
- Provider onboarding Step 1 heavily reworked:
  - grouped sections
  - date normalization
  - country code phone selector
  - inline live preview
  - profile image / logo support
  - headline / bio / years of experience fields
- Provider preview page added: `/provider/preview`
- Provider profile fields now flow into customer-facing shortlist cards
- Provider portal branding strengthened in sidebar/header
- Provider homepage hierarchy improved
- Provider account now has in-session password change
- Provider notifications added to nav
- Provider payouts page added: `/provider/payouts`

### Admin
- Admin customers page added: `/admin/customers`
  - search
  - marketing opt-in filter
  - repeat / no-booking / high-value segments
  - postcode and latest service category segmentation
- Admin refunds page added: `/admin/refunds`
- Admin payouts page extended with hold/release/block/extend controls
- Admin provider page now shows clearer approval blockers and submitted/approved timestamps

### Payments / Refunds / Payouts
- App-level provider payout hold system added
- Admin full / partial refund controls added
- Refund security tightened:
  - admin password required
  - confirm final refund amount required
  - acknowledgment checkbox required
- Refund history / audit trail / refund note records added
- Mock payment refund fallback added for test orders
- Payment / refund / payout definitions improved in admin UI

### Notifications / Reminders
- Ops notification email setting added in admin settings
- Provider application submitted -> admin/ops email added
- Provider new job email added
- Customer + provider 24h booking reminder cron added
- Unfinished onboarding reminder cron added
- Pending-assignment escalation alert added
- Abandoned booking reminder added before auto-cancel window

### SEO / Content
- Advice hub added: `/advice`
- 6 advice articles added
- Service pages and how-it-works structured data strengthened
- 32 borough pages remain in place
- Service category visibility switch added in admin settings:
  - key: `marketplace.enabled_service_categories`
  - affects homepage, quote flow, services page, pricing page, service SEO pages, sitemap

## Important Current Architecture Decisions

### Provider Pricing / Dispatch
- Current platform model still fundamentally uses provider-based pricing, not a platform-flat-price model
- Direct-charge / connected-account payment logic still assumes a selected provider exists before capture flow
- Short-term recommendation was to surface shortlisted providers to customers rather than fully auto-dispatch blindly

### Service Category Visibility
- Admin can enable/disable service categories from settings
- Disabled categories are hidden from:
  - homepage service cards
  - quote flow categories
  - services page
  - pricing page
  - service SEO pages
  - sitemap

## Known Remaining Gaps / Not Fully Finished

### Legal / Compliance
- Major remaining blocker area
- Still incomplete:
  - `src/content/legal/customer-terms.txt`
  - `src/content/legal/refund-policy.txt`
  - `src/content/legal/gdpr-policy.txt`
  - `src/content/legal/cookie-policy.txt` may still need final business/legal review
  - `src/app/(marketing)/cleaner-terms/page.tsx`

### Integrations Not Fully Activated Yet
- Google login groundwork exists, but needs live keys
- Crisp scaffold exists, but needs `NEXT_PUBLIC_CRISP_WEBSITE_ID`
- WhatsApp support button scaffold exists, but needs `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL`

### Payment Ops Still Not Fully Final
- App-level payout hold exists
- Stripe bank-level manual payout release is not fully implemented yet
- Refund / payout policy engine can still be refined further

## Important Routes

### Public / Customer
- `/quote`
- `/quote/[reference]`
- `/booking/confirmation/[reference]`
- `/booking/status/[reference]`
- `/support`
- `/services`
- `/pricing`
- `/how-it-works`
- `/advice`

### Provider
- `/provider/login`
- `/provider/apply`
- `/provider/onboarding`
- `/provider/application-confirmation`
- `/provider/application-status`
- `/provider/preview`
- `/provider/orders`
- `/provider/payouts`

### Admin
- `/admin/providers`
- `/admin/provider/[id]`
- `/admin/orders`
- `/admin/orders/[reference]`
- `/admin/payouts`
- `/admin/refunds`
- `/admin/customers`
- `/admin/settings`

## Important Notes For Next Session
- Do not assume localhost reflects latest changes until the dev server has been restarted; this session required many cache clears / restarts
- Provider onboarding had several issues caused by front-end-only step progression; steps now save to DB on continue
- If admin provider approval appears to fail, check required document approval states first (especially insurance on company flows)
- Some old provider document records point to missing files; admin page now shows missing-file state instead of broken links
- If testing provider shortlist, use a postcode/service combo that truly has multiple providers (for example `SW1A 1AA` + `Cleaning`)

## Recommended Next Priorities
1. Final legal/compliance pass
2. Activate live env keys (Google/Crisp/WhatsApp)
3. Continue refining customer provider selection flow
4. Continue reducing admin complexity and clarifying operational states
5. Provider acquisition / onboarding optimization
