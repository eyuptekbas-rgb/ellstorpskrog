# System Architecture

## Overview

Ellstorps Krog RMS is a multi-tenant restaurant platform built on **Next.js 16 App Router**, **Prisma/PostgreSQL**, and **NextAuth v5**. Staff surfaces (admin, POS, kitchen, delivery) share tenant scoping, feature flags, and a realtime SSE bus.

## Layers

| Layer | Responsibility |
|-------|----------------|
| **Routes** | `app/` pages for public site, `/order`, staff RMS, platform admin |
| **API** | `app/api/` REST endpoints; existing contracts preserved |
| **Domain libs** | `lib/orders`, `lib/rms`, `lib/printing`, `lib/realtime`, `lib/reports` |
| **Client RMS** | localStorage for device prefs, offline queue, delivery assignments |
| **Realtime** | In-process SSE pub/sub per tenant (`lib/realtime/bus.ts`) |

## Key flows

### Guest self-order (`/order`)
1. Guest scans QR → `/order?table=5&qr=1`
2. Menu from `GET /api/self-order/menu`
3. Order via `POST /api/self-order` → `createGuestTableOrder`
4. Tracking via `GET /api/self-order/track`
5. Kitchen/POS receive SSE `NewOrder`

### Staff POS (`/pos`)
- Order list via SSE + `/api/orders`
- Quick Sale mode with catalog `GET /api/admin/pos/catalog`
- Customer display via BroadcastChannel provider

### Kitchen KDS
- `/kitchen` production columns or `/kitchen?kds=2` drag-and-drop v2
- Station filter: `/kitchen?screen=pizza`

### Delivery (`/delivery`)
- Delivery queue synced from delivery orders (client localStorage)

## Security

- Middleware gates staff routes
- `requirePermission()` on sensitive admin APIs
- Rate limits on public self-order and staff mutations
- Audit log via `StaffAuditLog`

## Deployment constraints

- SSE bus is **single-instance** (in-memory). Scale horizontally with sticky sessions or external pub/sub later.
- Terminal/delivery assignments use client storage unless extended to DB.

## Diagram

```mermaid
flowchart LR
  Guest[/order] --> SelfOrderAPI
  SelfOrderAPI --> DB[(PostgreSQL)]
  SelfOrderAPI --> SSE[Realtime Bus]
  SSE --> POS[/pos]
  SSE --> Kitchen[/kitchen]
  POS --> Printing
  POS --> CustomerDisplay
```
