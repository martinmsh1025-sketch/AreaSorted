# Database Backup And Failover Plan

## Goal

Protect bookings, customers, providers, pricing, and payment records if the main database fails or data is accidentally damaged.

## Recommended Architecture

### Phase 1 - Launch Ready

- Use one managed primary Postgres database
- Enable automated backups
- Enable point-in-time recovery (PITR)
- Document restore process

This is enough for early launch if tested properly.

### Phase 2 - Higher Resilience

- Add a read replica
- Add failover procedure
- Add regular restore tests

### Phase 3 - Mature Setup

- Multi-region strategy if needed
- Automated failover if scale and budget justify it

## Minimum Backup Policy

- Automated daily backups
- PITR enabled
- Retain backups for at least 7 to 14 days
- Confirm backup provider region and retention policy

## Restore Drill Checklist

Run this before public launch and then periodically.

1. Create a restore from backup or point in time
2. Connect a local or preview environment to the restored database
3. Verify these tables contain expected data:
   - customers
   - bookings
   - quote requests
   - provider companies
   - pricing rules
   - payment records
4. Verify app can boot successfully against restored DB
5. Document time to recovery

## Failover Runbook

If primary DB fails:

1. Confirm issue is database-related, not app-related
2. Freeze risky writes if needed
3. Restore from backup or promote replica depending on provider setup
4. Update `DATABASE_URL` in Vercel if required
5. Redeploy app if connection target changed
6. Verify critical flows:
   - homepage
   - quote estimate
   - customer login
   - provider login
   - admin orders
   - Stripe webhook health
7. Announce degraded mode or incident status internally

## Data Priority Order

Highest priority:

- bookings
- payment records
- customers
- provider companies
- pricing rules

Lower priority but still important:

- contact messages
- audit / notification history
- derived content caches

## Recommended Provider Features

If using Neon or similar, confirm:

- automated backups
- PITR
- branching / restore support
- connection pooling strategy
- clear restore workflow

## Launch Decision Rule

Do not publicly launch until:

- backup is enabled
- PITR is enabled
- restore has been tested once
- database credentials are only stored in secure env vars
