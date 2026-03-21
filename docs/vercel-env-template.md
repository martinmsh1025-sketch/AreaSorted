# Vercel Env Template

Use this as the minimum checklist when setting up a Vercel preview or production deployment for AreaSorted.

## Must Set First

These are the minimum values you should set before expecting the app to work properly.

```env
NODE_ENV=production

DATABASE_URL=

NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app

SESSION_SECRET=
CRON_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

SIMPLY_POSTCODE_API_KEY=
```

## Strongly Recommended

These are usually needed for the full customer and provider experience.

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=

UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

## Optional Or Environment-Specific

Only set these if your deployment uses them.

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_SECURE=

STRIPE_CONNECT_WEBHOOK_SECRET=

NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

## Notes

- Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` to the exact Vercel deployment domain.
- After deploy, update Stripe webhook endpoints to use the deployed domain.
- `SESSION_SECRET` and `CRON_SECRET` should be long random values.
- For preview deploys, you can start with test Stripe keys.
- If email, upload, or maps are not configured yet, those parts of the app may not fully work even if the site deploys.

## Suggested Setup Order

1. Set the `Must Set First` block
2. Deploy preview on Vercel
3. Confirm homepage, quote flow, admin login, provider onboarding load
4. Add email, upload, and maps keys
5. Add Stripe webhook using deployed URL
