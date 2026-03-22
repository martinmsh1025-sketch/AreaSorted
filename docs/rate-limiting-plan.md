# Rate Limiting Plan

## Goal

Protect auth, booking, contact, lookup, and admin-related endpoints from brute force, scraping, spam, and accidental overload.

## Highest Priority Endpoints

### Authentication

- `POST /customer/login`
- `POST /customer/register`
- `POST /customer/forgot-password`
- `POST /customer/reset-password/[token]`
- `POST /provider/login`
- `POST /provider/forgot-password`
- `POST /provider/reset-password/[token]`
- `POST /admin/login`

Recommended rule:

- 5 to 10 attempts per IP per 10 minutes for login-like actions
- stronger protection for admin login

### Public APIs

- `POST /api/public-quotes`
- `POST /api/quote-estimate`
- `POST /api/contact`
- `GET /api/postcode-search`
- `GET /api/postcode-address`

Recommended rule:

- postcode lookup: moderate burst allowed
- quote estimate: medium rate limit
- contact form: lower threshold to stop spam

### Sensitive Internal Endpoints

- `POST /api/stripe/webhook` (protect with signature verification, not IP rate limit only)
- `GET /api/cron` (protect with `CRON_SECRET`)

## Suggested First Implementation

### Edge / WAF Layer

Use Cloudflare or similar for:

- bot protection
- basic DDoS absorption
- IP reputation filtering
- path-level rate limits

### App Layer

Add application-side rate limiting for:

- login actions
- reset email actions
- quote creation
- contact form

Good storage choices:

- Upstash Redis
- provider-native KV/Redis store

## Practical Limits To Start With

### Customer login
- 5 attempts / 10 min / IP

### Provider login
- 5 attempts / 10 min / IP

### Admin login
- 3 attempts / 15 min / IP

### Forgot password
- 3 requests / 30 min / email+IP pair

### Quote estimate
- 30 requests / 10 min / IP

### Public quote create
- 10 requests / 30 min / IP

### Contact form
- 3 requests / 30 min / IP

### Postcode search
- 60 requests / 10 min / IP

## What To Log

- blocked IP
- blocked route
- timestamp
- rough user agent
- optional account/email target for auth-related routes

## Warning Signs To Monitor

- many failed logins from same IP
- many forgot-password requests to many emails
- repeated postcode scraping
- high-volume quote estimate traffic with no conversions
- contact form spam bursts

## Launch Recommendation

At minimum before public launch:

- rate limit login routes
- rate limit forgot-password routes
- rate limit quote estimate and quote create
- rate limit contact form
- put the site behind Cloudflare or equivalent
