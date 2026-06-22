# Maintenance Guide

## Daily

- [ ] Check `/admin/system` — no launch blockers
- [ ] Verify terminals online at `/admin/terminals`
- [ ] Spot-check receipt print from POS
- [ ] Review `/admin/audit` for unusual activity

## Weekly

- [ ] Export logs via `/admin/system` → Exportera loggar
- [ ] Test kitchen ticket routing per station
- [ ] Verify customer display on second monitor
- [ ] Clear stale print retry queues if any failures accumulated

## Monthly

- [ ] Database backup verification (restore to staging)
- [ ] Review `docs/KNOWN_LIMITATIONS.md`
- [ ] Update printer IP documentation if network changed
- [ ] Run `npm run check:env` before deploy

## Hardware maintenance

### ZQ-P108B

- Clean touch screen with microfiber cloth
- Keep charging; avoid battery swell on 24/7 kiosk
- Clear browser cache if PWA behaves oddly

### Thermal printers

- Clean print head monthly (manufacturer kit)
- Keep spare paper rolls
- Verify cutter blade after 50k prints

### Barcode scanners

- USB wedge: verify Enter suffix programmed
- Replace USB cable if intermittent scans

## Software updates

1. Deploy to staging
2. Run quality gates: `typecheck`, `lint`, `test`, `build`
3. Execute `docs/HARDWARE_TEST_PLAN.md` on physical terminal
4. Deploy production during low-traffic window
5. Monitor `/admin/monitoring` for 30 minutes

## Operations (one-click)

Available at **`/admin/system`**:

| Operation | Effect |
|-----------|--------|
| Starta om realtime | SSE reconnect on all terminals |
| Återanslut skrivare | Re-probe network printer status |
| Rensa utskriftskö | Clear local retry queue |
| Synka terminaler | Force heartbeat |
| Exportera loggar | Download metrics JSON |

## Swish / card terminal

- Swish: verify checks at `/admin/system` (stub until SDK integrated)
- Card terminals: Nets/Worldline/Zettle/Stripe Terminal stubs — no maintenance until connected

## Support checklist

When staff reports an issue, collect:

1. Terminal ID from `/admin/terminals`
2. Browser + resolution
3. Printer IP and last print error toast
4. SSE badge state (POS header)
5. Export logs JSON
