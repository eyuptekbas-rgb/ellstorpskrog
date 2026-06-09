# Production Environment Variables — Ellstorps Krog

All variables for Vercel **Production** environment. Set in:

**Vercel → Project → Settings → Environment Variables**

---

## Required variables

### `DATABASE_URL`

PostgreSQL connection string for Prisma.

```
postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

| Provider | Notes |
|----------|-------|
| Vercel Postgres | Auto-injected when linked; use `POSTGRES_URL` or pooled URL |
| Neon | Use pooled connection string for serverless |
| Supabase | Use **Transaction** pooler URL for serverless |

**Verified:** Prisma schema + `postinstall: prisma generate`. Health check runs `SELECT 1`.

---

### `AUTH_SECRET`

Session signing secret for Auth.js (NextAuth v5).

```bash
openssl rand -base64 32
```

| Rule | Value |
|------|-------|
| Minimum length | 32 characters |
| Never commit | Keep only in Vercel env |
| Rotation | Requires all users to re-login |

**Verified:** `auth.config.ts` — JWT sessions, 7-day max age, `trustHost: true`. Middleware protects `/admin/*` and staff API routes.

---

### `NEXT_PUBLIC_APP_URL`

Public HTTPS URL of the site. **Must be set before production deploy.**

```
https://www.ellstorpskrog.se
```

Used by:

- SEO canonical URLs and `metadataBase`
- Open Graph / Twitter card URLs
- Stripe Checkout `success_url` / `cancel_url`
- Email links (order admin URLs)
- `sitemap.xml` and `robots.txt` host

**Without this:** URLs default to `http://localhost:3000` or `VERCEL_URL` preview hostname.

---

### `STRIPE_SECRET_KEY`

Stripe **live** secret API key (`sk_live_...`).

Dashboard → Developers → API keys.

Can be overridden per-mode in `/admin/payments` (database). Env is fallback when admin keys are empty.

**Verified integration points:**

| Endpoint | Purpose |
|----------|---------|
| `POST /api/checkout/create-session` | Create Checkout Session |
| `GET /api/checkout/session` | Verify payment on success page |
| `POST /api/webhooks/stripe` | `checkout.session.completed`, `payment_intent.*` |
| `lib/orders/payment.ts` | Updates `paymentStatus` to PAID/FAILED |

---

### `STRIPE_PUBLISHABLE_KEY`

Stripe **live** publishable key (`pk_live_...`).

Must match the mode of `STRIPE_SECRET_KEY`. Exposed to client via `/api/settings/public` when card payments enabled.

---

### `STRIPE_WEBHOOK_SECRET`

Signing secret from Stripe webhook endpoint (`whsec_...`).

**Webhook URL:**

```
https://www.ellstorpskrog.se/api/webhooks/stripe
```

Create separate endpoints for test and live in Stripe Dashboard. For production, use the **live** endpoint secret.

---

### `RESEND_API_KEY`

Resend API key (`re_...`).

Dashboard → API Keys.

**Without this:** All transactional email is disabled. `isEmailConfigured()` returns false.

**Verified templates (8):** Order confirmation, payment confirmation, order ready/delivered/cancelled, restaurant new order/payment/cancelled.

**Retry:** Manual retry up to 3× via `/admin/notifications` or `POST /api/notifications/retry`.

---

### `RESEND_FROM_EMAIL`

Verified sender address in Resend.

```
no-reply@ellstorpskrog.se
```

Must match a domain verified in Resend. Overridable in `/admin/notifications` (`emailSenderAddress`).

---

### `CONTACT_TO_EMAIL`

Inbox for contact form submissions.

```
info@ellstorpskrog.se
```

Used by `POST /api/contact`.

---

## Vercel auto-injected (do not set manually)

| Variable | Description |
|----------|-------------|
| `VERCEL_URL` | Deployment hostname (preview or production) |
| `VERCEL_ENV` | `production`, `preview`, or `development` |
| `NODE_ENV` | `production` on deploy |

`getSiteUrl()` falls back to `https://${VERCEL_URL}` only when `NEXT_PUBLIC_APP_URL` is unset — **always set the public URL explicitly for production**.

---

## Optional variables

| Variable | Purpose |
|----------|---------|
| `ADMIN_INITIAL_PASSWORD` | Override default for `ensure-admin.ts` / seed only |
| `AUTH_URL` | Rarely needed; `trustHost: true` handles Vercel |
| `STRIPE_TEST_*` / `STRIPE_LIVE_*` | Separate test/live keys (see `PRODUCTION_SETUP.md`) |

---

## Environment scopes in Vercel

| Variable | Production | Preview | Development |
|----------|-------------|---------|---------------|
| `DATABASE_URL` | Production DB | Preview DB or shared | Local `.env` |
| `AUTH_SECRET` | Unique strong secret | Can share or separate | Local `.env` |
| `NEXT_PUBLIC_APP_URL` | `https://www.…` | Preview URL or production | `http://localhost:3000` |
| Stripe keys | **Live** keys | **Test** keys | Test keys |
| Resend | Production API key | Same or test | Local `.env` |

---

## Validation

```bash
npm run check:env
```

All required keys should show `SET`. Then:

```bash
npm run build
```

Post-deploy: visit `/admin/system` for readiness % and blockers.
