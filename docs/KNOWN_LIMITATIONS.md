# Known Limitations

Documented constraints at launch. These are architectural or scope boundaries — not bugs.

## Realtime (SSE)

- Event bus is **in-memory per Node process**. Horizontal scaling requires sticky sessions or an external pub/sub (Redis, etc.).
- SSE reconnect uses polling fallback; brief duplicate fetches possible during reconnect.
- Connection count in monitoring reflects current process only.

## Client-side persistence

The following use **browser localStorage** (per device, not synced across terminals):

- Terminal settings (sound, auto-print)
- Printer registry
- Delivery driver assignments
- Table ↔ order assignments (floor plan)
- Shift clock in/out sessions
- POS favorites and coupons
- Offline action queue
- Print retry queue and print history
- KDS drag layout overrides

For multi-terminal consistency, future work would require server persistence (out of current Prisma scope).

## Self-order (`/order`)

- Guest orders use `POST /api/self-order` — separate from checkout/payment flow.
- Payment is **not collected online**; guests pay at table or counter.
- Tracking requires order number + phone last 4 digits.
- Menu reads public tenant context (same as customer site).

## POS Quick Sale

- Sale completion is **local UI flow** — does not create paid orders in payment backend (by design; payment backend unchanged).
- Refund registration is audit/UI only until payment integration is extended.
- Barcode scanner uses stub provider until hardware is connected.

## Printing

- Production printing defaults to **browser print dialog**.
- Network ESC/POS, USB, Windows, and Android providers are interface stubs.
- Auto-print depends on terminal settings and browser pop-up permissions.

## Backup

- Admin backup uses `pg_dump` on the app server; requires PostgreSQL client tools.
- Managed databases (Neon, Supabase) should use provider snapshots as primary DR strategy.
- Restore is CLI-only (`npm run ops:restore`).

## Delivery screen

- Driver list is hardcoded sample data (Alex, Sam, Jordan).
- ETA is heuristic based on address length, not maps/routing API.

## Kitchen KDS v2

- Drag-and-drop layout saved locally per browser.
- Product → station routing uses keyword matching on product names, not menu category IDs.

## Customer display

- Uses BroadcastChannel + localStorage; second screen must be same origin/browser profile.
- No dedicated hardware driver for pole displays.

## Security

- Rate limiting is in-memory per instance (same scaling caveat as SSE).
- CSRF: NextAuth session cookies + SameSite defaults; no additional CSRF tokens on JSON APIs.

## Performance

- PWA service worker caches public pages; staff routes excluded from offline precache.
- Large admin pages may benefit from further virtualization (orders list already virtualized in POS).

## Out of scope (unchanged by design)

- Online checkout and Stripe payment flow
- Reservation booking flow
- Menu management and public menu pages
- Existing REST API request/response contracts
- Prisma schema / database models
