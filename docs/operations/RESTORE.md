# Database restore procedure

## Prerequisites

- Access to production `DATABASE_URL` (read/write, restore role)
- Recent backup file (`.dump`) or provider PITR timestamp
- Maintenance window communicated to customers

## Restore from pg_dump (custom format)

1. **Stop traffic** — pause Vercel deployment or enable maintenance mode.
2. **Create empty database** (or drop/recreate staging clone first).
3. **Restore:**

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" backup-YYYYMMDD.dump
```

4. **Run migrations** (if dump is older than latest schema):

```bash
npx prisma migrate deploy
```

5. **Verify:**

```bash
npm run db:check
npm run test:billing
```

6. **Smoke test** — login to `/admin`, `/platform/ekonomi`, place test order on staging.

## Point-in-time recovery (managed providers)

1. Open provider console (Neon / Supabase / RDS).
2. Select restore timestamp **before** the incident.
3. Create new branch/instance; update `DATABASE_URL` in Vercel.
4. Redeploy application.

## Post-restore checklist

- [ ] Tenant count matches expected
- [ ] `Tenant.customerNumber` populated for all active tenants
- [ ] Stripe webhook secrets unchanged in `SiteSettings`
- [ ] Cron jobs scheduled in `vercel.json`
- [ ] Resend domain verified for billing emails

## Rollback

If restore fails, revert `DATABASE_URL` to previous instance and redeploy last known-good build.
