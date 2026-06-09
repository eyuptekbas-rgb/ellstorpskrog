# Production Environment Checklist — Ellstorps Krog

Copy this checklist when configuring Vercel environment variables.

## Required (launch blockers)

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Vercel Postgres, Neon, or Supabase |
| `AUTH_SECRET` | `openssl rand -base64 32` | Min 32 chars, never commit |
| `NEXT_PUBLIC_APP_URL` | `https://www.ellstorpskrog.se` | HTTPS production domain |

## Payments (Stripe)

### Recommended: separate test + live keys

| Variable | Where to get it |
|----------|-----------------|
| `STRIPE_TEST_SECRET_KEY` | Stripe Dashboard → API keys (test) |
| `STRIPE_TEST_PUBLISHABLE_KEY` | Same (test publishable) |
| `STRIPE_TEST_WEBHOOK_SECRET` | Webhooks → test endpoint signing secret |
| `STRIPE_LIVE_SECRET_KEY` | Stripe Dashboard → API keys (live) |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | Same (live publishable) |
| `STRIPE_LIVE_WEBHOOK_SECRET` | Webhooks → live endpoint signing secret |

Legacy fallback (single set for active mode): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

**Webhook URL:** `https://www.ellstorpskrog.se/api/webhooks/stripe`  
**Events:** `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

Toggle test/live in `/admin/payments` (`stripeTestMode`). DB keys override env.

See `docs/PRODUCTION_SETUP.md` for full Stripe + email guide.

## Email (Resend)

| Variable | Example |
|----------|---------|
| `RESEND_API_KEY` | `re_...` from Resend dashboard |
| `RESEND_FROM_EMAIL` | `no-reply@ellstorpskrog.se` |
| `CONTACT_TO_EMAIL` | `info@ellstorpskrog.se` |

**DNS (Resend domain verification):**

| Type | Name | Value |
|------|------|-------|
| TXT | `@` or subdomain | Resend verification record |
| MX | `send` (or as instructed) | Resend MX records |
| TXT | `send` | SPF record from Resend |
| CNAME | `resend._domainkey` | DKIM from Resend |

## Auth.js (automatic on Vercel)

| Variable | Notes |
|----------|-------|
| `AUTH_SECRET` | Required (see above) |
| `AUTH_URL` | Optional — Vercel sets `VERCEL_URL`; `trustHost: true` is enabled |

## Vercel auto-injected (do not set manually)

- `VERCEL_URL` — preview/production hostname
- `VERCEL_ENV` — `production`, `preview`, or `development`
- `NODE_ENV` — `production` on deploy

## Optional

| Variable | Default | Notes |
|----------|---------|-------|
| `ADMIN_INITIAL_PASSWORD` | `ChangeMe123!` | Only for `db:seed` / `ensure-admin.ts` |

## Pre-deploy commands

```bash
npx prisma migrate deploy
npx tsx scripts/ensure-admin.ts
npx tsx scripts/bootstrap-pwa-icons.ts
npm run check:env
npm run build
```

## Post-deploy verification

1. `GET https://www.ellstorpskrog.se/api/health` → `healthy` or acceptable `degraded`
2. `/admin/system` → review readiness % and blockers
3. Login → change admin password
4. Stripe test payment → webhook received
5. Send test email from `/admin/notifications/test`
6. Check `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`

## DNS for custom domain (Vercel)

| Type | Name | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Or use Vercel nameservers if domain is on Vercel.
