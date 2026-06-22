# Disaster Recovery

## Database (primary)

1. **Managed PostgreSQL** (Neon, Supabase, RDS): use provider snapshots as primary DR.
2. **Manual backup:** `/admin/backup` or `npm run ops:backup`.
3. **Restore:** `npm run ops:restore` (CLI, requires `pg_restore`).

**RPO:** Depends on snapshot schedule (recommend ≤ 1 hour for production).  
**RTO:** 15–60 minutes depending on provider.

## Application

1. Redeploy last known good Vercel deployment.
2. Verify `GET /api/deployment/diagnostics` → `ready: true`.
3. Run `docs/LAUNCH_CHECKLIST.md` smoke tests.

## Realtime (SSE)

- Event bus is in-memory per Node process.
- On deploy/restart: clients auto-reconnect (exponential backoff).
- Use **`/admin/system` → Starta om realtime** to force client refresh without redeploy.

## Printers

- Print retry queue is **per terminal** (localStorage).
- On terminal failure: switch to browser print fallback.
- Keep spare thermal printer with same IP config documented offline.

## Terminals

- Terminal registry is in-memory (lost on server restart).
- Terminals re-register via heartbeat within 20s.
- No order data lost — orders live in PostgreSQL.

## Customer display

- Second screen uses BroadcastChannel + localStorage.
- Recovery: reload `/customer-display` tab; auto-reconnect within 15s.

## Offline mode

- Status updates queue in `rms-offline-queue` per device.
- On reconnect: `OfflineProvider` syncs automatically.
- Conflicts: server status wins; staff notified via badge.

## Escalation

| Severity | Action |
|----------|--------|
| DB down | Failover to replica / restore snapshot |
| Payment (Stripe) down | Cash-only mode; online checkout disabled |
| All printers down | Browser print + manual kitchen tickets |
| Full outage | Static offline page (`/offline` PWA) |

## Contacts

Document on-site:

- Network admin (printer VLAN)
- Payment provider support (Stripe)
- Hosting support (Vercel)
