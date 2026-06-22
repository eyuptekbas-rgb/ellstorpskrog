# Printer Configuration — ESC/POS

## Supported transports

| Provider | Status | Use case |
|----------|--------|----------|
| Browser print | Default | Development, fallback |
| **Network ESC/POS** | **Implemented** | Production thermal printers |
| USB | Stub | Requires native wrapper |
| Windows spooler | Stub | Requires native wrapper |
| Android print | Stub | Requires Capacitor/TWA |

## Network ESC/POS setup

1. Connect printer to LAN (static IP recommended).
2. Verify port **9100** (raw TCP) is open.
3. Go to **`/admin/restaurant` → Skrivare**.
4. Set provider to **Network ESC/POS**.
5. Enter printer IP (per role) or global default below.
6. Enable **Nätverk ESC/POS (global)** with default IP.

### Per-role routing

| Role | Typical printer |
|------|-----------------|
| receipt | Counter receipt printer |
| kitchen | Kitchen pass |
| bar | Bar station |
| dessert | Dessert station |

Category IDs optionally route items to specific printers.

## API endpoints (staff auth required)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/admin/print/escpos` | Send raw ESC/POS bytes |
| POST | `/api/admin/print/status` | Paper-out / online status |
| POST | `/api/admin/print/discover` | Ping printer IPs |

## Cash drawer

Cash drawer kick uses ESC/POS `ESC p` command on the same network printer.

Configure drawer provider: **Network ESC/POS cash drawer** (via `/admin/restaurant` or programmatic `setCashDrawerProvider`).

## Retry queue

Failed prints enqueue to `rms-print-retry-queue` (localStorage, max 5 attempts).  
`RmsProviders` retries every 30 seconds.

Clear queue: **`/admin/system` → Rensa utskriftskö**.

## Paper-out detection

Status query uses ESC/POS DLE EOT. Results are abstracted — not all printer models respond identically. Treat `paperOut: true` as a hard stop and notify staff.

## Security

- Print API requires staff `settings` permission
- Host validated (hostname/IP pattern only)
- Raw TCP from **server** only (not browser-direct)

## Testing

```bash
# From app server (must reach printer LAN)
curl -X POST https://your-app/api/admin/print/discover \
  -H "Cookie: ..." \
  -H "Content-Type: application/json" \
  -d '{"hosts":["192.168.1.100"],"port":9100}'
```

See `docs/HARDWARE_TEST_PLAN.md` for full checklist.
