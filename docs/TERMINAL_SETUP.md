# Terminal Setup — ZQ-P108B

## Hardware

- **Model:** ZQ-P108B (15" touch POS)
- **Resolutions:** 1024×768 or 1280×800, landscape only
- **Network:** Same LAN as ESC/POS printers and app server

## Browser

1. Install **Chrome** or **Edge** (recommended for kiosk + BarcodeDetector).
2. Add to home screen / kiosk mode if available.
3. Navigate to `https://your-domain/pos` and log in as staff.

## Kiosk settings

The app automatically:

- Detects ZQ-P108B resolution profile
- Requests fullscreen
- Disables pinch-zoom (`viewport` + CSS)
- Blocks text selection and overscroll
- Shows portrait blocker if device rotated

Manual fullscreen: use the fullscreen button in POS topbar if auto-fullscreen is blocked (requires one tap first on some browsers).

## Terminal identity

Each browser stores:

- `rms-terminal-id` — unique terminal UUID
- `rms-terminal-meta` — name, location, kitchen

Configure at `/admin/terminals`. Heartbeat every 20s reports online status and queue lengths.

## Recommended `/admin/restaurant` settings

| Setting | Value |
|---------|-------|
| Auto-print kitchen | On |
| Auto-print receipt | Off (manual at payment) |
| POS sound | On |
| Default fullscreen | On |
| Printer provider | Network ESC/POS |
| Printer IP | Your thermal printer LAN IP |

## Multi-terminal

- Each ZQ-P108B gets its own terminal ID
- Settings (printers, favorites) are per-device (localStorage)
- Server tracks presence via heartbeat API

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No auto-fullscreen | Tap screen once, then reload |
| Portrait lock | Rotate to landscape |
| Printer not found | Verify IP, ping from server, check port 9100 |
| SSE disconnected | Check `/admin/system` → Restart realtime |
