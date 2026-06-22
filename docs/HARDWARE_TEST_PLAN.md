# Hardware Test Plan — Phase 7

Use this plan on staging hardware before production go-live.

## ZQ-P108B POS terminal

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | Boot to `/pos` | Auto fullscreen within 1s |
| 2 | Resolution 1024×768 | Layout fits, no horizontal scroll |
| 3 | Resolution 1280×800 | Touch targets ≥ 48px |
| 4 | Portrait rotation | “Vänd enheten” blocker shown |
| 5 | Pinch zoom | Disabled |
| 6 | Text selection | Disabled outside inputs |
| 7 | Overscroll bounce | None on POS shell |
| 8 | Quick Sale | Opens, search works, touch targets OK |

## Network ESC/POS printer

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | Configure IP at `/admin/restaurant` | Saved to localStorage |
| 2 | Print receipt from POS | Paper output within 5s |
| 3 | Print kitchen ticket | Correct station routing |
| 4 | Cash drawer kick | Drawer opens (if wired) |
| 5 | Printer offline | Toast error + retry queue |
| 6 | Paper out simulation | Error message surfaced |
| 7 | Status check | `/api/admin/print/status` returns online |
| 8 | Discovery | Ping known IPs via discover API |

## Customer display

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | Open `/customer-display` on 2nd screen | Shows idle welcome |
| 2 | Quick Sale add item | Items + total update live |
| 3 | Payment phase | “Bearbetar betalning” shown |
| 4 | Complete sale | Thank-you screen |
| 5 | Disconnect POS tab | Display shows “Återansluter…” then recovers |

## Barcode scanner

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | USB/keyboard wedge scan | Product added in Quick Sale |
| 2 | Unknown barcode | Error toast |
| 3 | Scan while input focused | Ignored (no double entry) |
| 4 | Camera scan (Chrome) | Optional — product found |

## Swish (verification only)

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | `/admin/system` Swish section | Checks listed |
| 2 | `SWISH_MERCHANT_NUMBER` set | Status OK |
| 3 | Stub provider documented | No checkout changes |

## Card terminal (future)

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | Provider list | Nets, Worldline, Zettle, Stripe Terminal stubs |
| 2 | Connect attempt | Clear “not configured” message |

## Admin system & operations

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | `/admin/system` hardware panel | CPU, memory, SSE, terminals |
| 2 | Restart realtime | Terminals reconnect SSE |
| 3 | Reconnect printers | Status re-checked |
| 4 | Clear print queue | Queue empty on terminal |
| 5 | Resync terminals | Heartbeat updates lastSeen |
| 6 | Export logs | JSON download |

## Sign-off

- [ ] All critical tests pass on ZQ-P108B
- [ ] Receipt + kitchen print verified on physical printer
- [ ] Customer display tested on second monitor
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` pass
