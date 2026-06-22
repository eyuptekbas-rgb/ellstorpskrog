# Launch Checklist

Use this checklist before go-live. All items should be verified in staging with production-like env vars.

## Environment

- [ ] `DATABASE_URL` reachable from app host
- [ ] `AUTH_SECRET` ≥ 32 chars, not a placeholder
- [ ] `AUTH_URL` / `NEXT_PUBLIC_APP_URL` set to production HTTPS
- [ ] Stripe live keys + webhook secret configured
- [ ] Resend email keys configured
- [ ] `CRON_SECRET` set for billing crons
- [ ] `npm run check:env` passes
- [ ] `GET /api/deployment/diagnostics` returns `ready: true`

## Security

- [ ] Staff routes require login (`/admin`, `/pos`, `/kitchen`, `/delivery`)
- [ ] Public self-order rate-limited (`POST /api/self-order`)
- [ ] Security headers present (HSTS, X-Frame-Options, nosniff)
- [ ] No secrets in client bundle or public settings API
- [ ] Platform admin tenant selection enforced

## POS workflow

- [ ] Login → `/pos` loads order list
- [ ] SSE live updates (or polling fallback) refresh orders
- [ ] Order status update from drawer works
- [ ] Quick Sale opens, adds products, updates customer display
- [ ] Print receipt / kitchen ticket (browser print)
- [ ] Offline badge appears when network disabled; status syncs on reconnect

## Kitchen workflow

- [ ] `/kitchen` shows NEW / COOKING / READY columns
- [ ] `/kitchen?kds=2` drag-and-drop updates status
- [ ] Station filter `?screen=pizza` filters items
- [ ] Sound alert on new orders (if enabled)

## QR self-order

- [ ] `/order?table=5&qr=1` loads menu without login
- [ ] Guest can submit order to kitchen
- [ ] Order tracking works with phone last 4 digits
- [ ] Kitchen receives realtime `NewOrder`

## Delivery

- [ ] `/delivery` shows delivery orders in queue
- [ ] Driver assignment persists (localStorage per device)
- [ ] Status transitions update queue

## Customer display

- [ ] `/customer-display` on second screen/monitor
- [ ] POS Quick Sale updates items and total
- [ ] Thank-you screen after sale completes

## Reports & operations

- [ ] `/admin/reports` X/Z/daily close loads
- [ ] CSV and PDF export download
- [ ] Cash reconciliation variance calculates
- [ ] `/admin/backup` lists backups; manual backup runs (if `pg_dump` available)
- [ ] `/admin/monitoring` shows health + memory + SSE count
- [ ] `/admin/audit` shows recent actions

## Multi-terminal & printing

- [ ] Terminal heartbeat visible at `/admin/terminals`
- [ ] Printer roles configured at `/admin/restaurant`
- [ ] Failed prints show toast + retry queue

## Realtime

- [ ] SSE reconnects after network blip (badge shows Återansluter → hidden)
- [ ] Polling fallback active when SSE unavailable

## Quality gates (CI / pre-deploy)

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

All must pass with zero TypeScript errors and zero ESLint errors.

## Post-launch smoke (first hour)

- [ ] Place test self-order from phone
- [ ] Advance order through kitchen on `/kitchen`
- [ ] Complete or cancel from `/pos`
- [ ] Verify audit log entry for status change
- [ ] Check `/api/health` returns healthy
