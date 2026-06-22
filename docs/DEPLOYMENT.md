# Deployment

## Pre-flight checklist

```bash
npm run check:env
npm run launch:env
curl https://your-domain/api/deployment/diagnostics
curl https://your-domain/api/health
```

## Required environment

See `lib/env/launch-vars.ts` for validated keys:

- `DATABASE_URL`
- `AUTH_SECRET` (32+ chars)
- `AUTH_URL` / `NEXT_PUBLIC_APP_URL`
- Stripe keys + webhook secret
- Resend email keys
- `CRON_SECRET`

## Build & start

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

## Diagnostics endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | DB, auth, Stripe, email |
| `GET /api/deployment/diagnostics` | Full launch readiness |
| `GET /api/admin/monitoring` | Runtime metrics (staff) |

## Security validation

- `AUTH_SECRET` strength checked at startup diagnostics
- HTTPS recommended for production URLs
- Staff API routes require session + tenant scope
- Rate limits on `/api/self-order`, staff mutations

## Post-deploy smoke

```bash
npm run launch:e2e
npm run test
```

## Single-instance note

Realtime SSE uses in-memory bus. Use one Node process or sticky sessions until external pub/sub is added.
