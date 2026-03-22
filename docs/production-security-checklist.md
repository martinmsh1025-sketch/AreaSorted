# Production Security Checklist

Use this before public launch.

## P0 - Must Have Before Launch

- Use a managed Postgres provider with automated backups and point-in-time recovery
- Store all secrets in Vercel environment variables only
- Rotate production secrets before launch:
  - `SESSION_SECRET`
  - `CRON_SECRET`
  - database password
  - Stripe keys if test keys were ever reused
- Ensure `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` are correct production URLs
- Confirm all sensitive routes enforce role-based access:
  - customer only sees own bookings
  - provider only sees own data
  - admin only sees admin-only resources
- Review provider document access and make sure files are not publicly guessable
- Add rate limiting to auth and public APIs
- Enable production error monitoring
- Verify Stripe webhook secret is production-only

## P1 - Strongly Recommended

- Put Cloudflare or equivalent in front of the site
- Add WAF and bot protection rules
- Add security headers:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- Add admin login protection beyond password alone
- Add audit logging for admin-sensitive actions
- Limit document download URLs with signed/expiring links if possible
- Review upload validation and maximum file type restrictions

## P2 - Mature Production Hardening

- Add admin 2FA
- Add anomaly alerts for auth spikes, reset spikes, and webhook failures
- Add IP-based protections for repeated failed logins
- Add periodic access review for provider/admin accounts
- Run restore drills from backup snapshots

## Sensitive Data Areas To Review

- Customer names, phone numbers, addresses, emails
- Provider identity documents
- Provider company documents
- Booking and payment records
- Password reset tokens
- Session cookies

## Current Strengths In This Project

- Signed session cookies
- Role-separated auth flows
- Server-side form handling in critical places
- Managed payment provider integration through Stripe
- Centralised provider/customer/admin flows

## Current Gaps To Close

- No full production-grade rate limiting yet
- No formal WAF setup yet
- No admin 2FA yet
- No documented restore drill yet
- Sensitive file access model should be reviewed before launch
