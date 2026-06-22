# Operations

## Daily operations

| Task | Location |
|------|----------|
| X Report (shift) | `/admin/reports` → X Report |
| Z Report (day close) | `/admin/reports` → Z Report |
| Cash reconciliation | Enter counted cash on reports page |
| Audit review | `/admin/audit` |
| Terminal status | `/admin/terminals` |

## Export

From `/admin/reports`:

- **CSV/Excel** — `GET /api/admin/reports?kind=z&format=csv`
- **PDF** — `GET /api/admin/reports?kind=z&format=pdf`

## Backup & restore

### Automatic backup (CLI)

```bash
npm run ops:backup
```

### Admin UI

`/admin/backup` — list backups, trigger new backup

### Restore

```bash
npm run ops:restore -- backups/backup-YYYY-MM-DD.dump
```

Requires `pg_restore` on host. Prefer provider snapshots (Neon/Supabase) in production.

## Monitoring

`/admin/monitoring` shows:

- Health status
- Memory (heap/RSS)
- SSE connection count
- Print/offline queue metrics
- Uptime

## Incident response

1. Check `/api/health`
2. Check `/api/deployment/diagnostics`
3. Review audit log for printer/auth errors
4. Verify DATABASE_URL connectivity
5. Restart app if SSE subscribers leak (rare; redeploy clears in-memory state)

## Guest self-order QR

Generate URL format:

```
https://your-domain/order?table=TABLE_NAME&qr=1
```

Print QR codes linking to this URL for each table.
