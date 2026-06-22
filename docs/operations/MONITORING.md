# Monitoring and error logging

## Application errors

- **Vercel Logs** — runtime errors from API routes and server components.
- **Console patterns to alert on:**
  - `Stripe webhook signature verification failed`
  - `Stripe amount mismatch for order`
  - `Order price mismatch`
  - `RESEND_API_KEY is not configured`

## Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness |
| `npm run check:env` | Required env vars before deploy |
| `npm run db:check` | Database connectivity |

## Recommended production env vars

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CRON_SECRET=
ORDINA_BILLING_COMPANY_NAME=
ORDINA_BILLING_EMAIL=
ORDINA_BILLING_ADDRESS=
STRIPE_TEST_SECRET_KEY=
STRIPE_TEST_WEBHOOK_SECRET=
```

Per-tenant Stripe keys are stored in `SiteSettings` (never exposed via public API).

## Billing cron monitoring

Configured in `vercel.json`:

- `0 6 1 * *` — monthly invoice generation (`/api/platform/billing/cron/monthly`)
- `0 7 * * *` — overdue status (`/api/platform/billing/cron/overdue`)

Cron auth: `Authorization: Bearer $CRON_SECRET` or Vercel cron header.

## Security monitoring

- Review Vercel access logs for `401`/`403` spikes on `/api/orders/*`, `/api/products/*`.
- Rate limit hits (`429`) on `/api/faktura/lookup` and `/api/auth/*`.
- Run `npm run test` after each security release (billing + security suites).

## Alerting (production)

Set `ALERT_WEBHOOK_URL` to a Slack/Discord incoming webhook.  
`logError()` in `lib/logging/production-logger.ts` POSTs error payloads automatically.

Verify:

```bash
npm run launch:env   # ALERT_WEBHOOK_URL optional
```

## Launch sprint commands

| Command | Purpose |
|---------|---------|
| `npm run launch:env` | Environment checklist (Present / Missing / Validated) |
| `npm run launch:e2e` | End-to-end verification harness |
| `npm run launch:isolation` | Multi-tenant isolation checks |
| `npm run launch:sprint` | Run all checks + Go/No-Go |
| `npm run ops:backup` | `pg_dump` to `backups/` |
| `npm run ops:restore` | Restore from dump file |
