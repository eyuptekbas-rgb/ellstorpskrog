# Database backup strategy

## Overview

Ordina uses PostgreSQL. Production backups must be automated, encrypted at rest, and tested with restore drills.

## Recommended schedule

| Frequency | Retention | Method |
|-----------|-----------|--------|
| Continuous WAL | 7 days | Provider PITR (Neon, Supabase, RDS) |
| Daily full | 30 days | `pg_dump` or managed snapshot |
| Weekly full | 90 days | Off-site copy (separate region/account) |

## Vercel / managed Postgres

If using Neon, Supabase, or Vercel Postgres:

1. Enable **point-in-time recovery** in the provider dashboard.
2. Enable **automated daily snapshots**.
3. Store `DATABASE_URL` only in Vercel environment variables (never in git).

## Manual backup (development / fallback)

```bash
npm run ops:backup
```

Or directly:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=backup-$(date +%Y%m%d).dump
```

Store dumps in encrypted object storage (S3, R2) with lifecycle rules.

## What to back up

- PostgreSQL database (all tenants, orders, billing)
- Uploaded images under `public/uploads/` (if not on CDN)
- Environment variable export (secure vault only — not in repo)

## Verification

- Run a restore drill monthly (see `RESTORE.md`).
- After Ekonomi cron deploy, confirm `PlatformInvoice` rows exist for the prior month.

## Related env vars

- `DATABASE_URL` — primary connection string
- `CRON_SECRET` — protects billing cron endpoints
- `RESEND_API_KEY` — invoice email delivery
