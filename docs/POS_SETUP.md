# POS Setup

## Access

1. Staff login at `/login`
2. Open `/pos` (requires `orders` tenant feature)
3. Platform admins must select tenant at `/platform/tenants` first

## Terminal identity

Each device registers automatically via heartbeat (`lib/rms/terminal-client.ts`).

Configure name/location/kitchen at **Admin → Terminaler** (`/admin/terminals`).

## Modes

| Mode | How |
|------|-----|
| Order management | Default POS view |
| Quick Sale | Click **Quick Sale** in top bar |
| Fullscreen | Top bar fullscreen button |
| F1–F4 | Filter shortcuts (NEW, ACTIVE, etc.) |

## Quick Sale features

- Product search and favorites (localStorage)
- Barcode scanner provider hook (stub until hardware connected)
- Discounts, coupons, gift cards (local calculation)
- Refund draft registration (UI audit; no payment backend change)
- Customer display updates via second screen at `/customer-display`

## Offline

- Status badge shows Online/Offline/Syncing
- Order status changes queue locally and sync on reconnect

## Related routes

- Customer display: `/customer-display`
- Kitchen: `/kitchen`
- Delivery: `/delivery`
