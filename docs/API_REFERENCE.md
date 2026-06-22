# API Reference (Phase 5 additions)

Existing API contracts are unchanged. New endpoints:

## Public — Self Order

### `GET /api/self-order/menu`
Returns public menu categories and products for current tenant.

### `POST /api/self-order`
Create guest table order (no login).

Body:
```json
{
  "guestName": "Anna",
  "guestPhone": "0701234567",
  "table": "12",
  "tableId": "optional-id",
  "note": "No onion",
  "items": [
    { "productId": "...", "productName": "Margherita", "quantity": 1, "price": 120 }
  ]
}
```

### `GET /api/self-order/track?orderNumber=XXX&phoneLast4=4567`
Track order status for guest.

## Staff — POS

### `GET /api/admin/pos/catalog?search=pizza`
Lightweight product catalog for Quick Sale (max 200 items).

## Staff — Reports

### `GET /api/admin/reports?kind=x|z|daily&format=json|csv|pdf`
Sales report with optional `countedCash` for reconciliation.

## Staff — Backup

### `GET /api/admin/backup`
List local backup files.

### `POST /api/admin/backup`
Run `pg_dump` backup (requires CLI tools on server).

## Staff — Monitoring

### `GET /api/admin/monitoring`
Deployment diagnostics + runtime metrics.

## Deployment

### `GET /api/deployment/diagnostics`
Launch readiness (public). Returns 503 if not ready.

## Realtime (existing)

### `GET /api/realtime/stream`
SSE events: `NewOrder`, `OrderUpdated`, `KitchenUpdated`, `TableUpdated`, `StaffUpdated`

## Rate limits

| Route | Limit |
|-------|-------|
| `POST /api/self-order` | 15/min/IP |
| Staff mutations | 120/min/IP |
