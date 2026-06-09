# Complete Deployment Guide — Ellstorps Krog

**Purpose:** Step-by-step guide to deploy Ellstorps Krog to production on Vercel.  
**No code changes required** — configuration, DNS, and verification only.

**Related docs:** `LAUNCH_CHECKLIST.md` · `PRODUCTION_ENVIRONMENT.md` · `/admin/system`

---

## Overview

| Component | Provider | Admin UI |
|-----------|----------|----------|
| Hosting | Vercel | vercel.com |
| Database | PostgreSQL (Neon / Vercel Postgres / Supabase) | Provider dashboard |
| Payments | Stripe (live mode) | `/admin/payments` + Stripe Dashboard |
| Email | Resend | `/admin/notifications` + Resend Dashboard |
| Auth | Auth.js (NextAuth v5) | `/login` |

**Estimated setup time:** 2–4 hours (first deploy)

---

## 1. Vercel deployment steps

### 1.1 Pre-deploy (local)

Run these commands before pushing to Git:

```bash
npm run check:env          # verify env vars (use production values)
npm run build              # must pass without errors
npm run pwa:bootstrap      # generate PWA icons → public/icons/
npm run brand:images       # generate hero.jpg + category images
```

Commit generated assets (`public/icons/`, `public/hero.jpg`) if not already in the repo.

### 1.2 Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your Git repository (GitHub / GitLab / Bitbucket)
3. Configure project:
   - **Framework preset:** Next.js
   - **Root directory:** repository root (folder containing `package.json`)
   - **Build command:** `npm run build` (default)
   - **Output directory:** `.next` (default)
   - **Install command:** `npm install` (default — runs `postinstall` → `prisma generate`)
   - **Node.js version:** 20.x or 22.x (Settings → General)

### 1.3 First deploy (without custom domain)

1. Add **minimum env vars** before first deploy (see Section 6):
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL` — use Vercel preview URL temporarily, e.g. `https://your-project.vercel.app`
2. Click **Deploy**
3. Wait for build to complete — verify deployment URL loads

### 1.4 Database migration (post-deploy)

Run once against the **production** database:

```bash
# Option A: Vercel CLI (recommended)
npm i -g vercel
vercel login
vercel link
vercel env pull .env.production
npx prisma migrate deploy
npx tsx scripts/ensure-admin.ts

# Option B: Run locally with production DATABASE_URL in .env
npx prisma migrate deploy
npx tsx scripts/ensure-admin.ts
```

**Default admin credentials** (change immediately after login):

| Field | Value |
|-------|-------|
| Email | `admin@ellstorpskrog.se` |
| Password | `ChangeMe123!` (or value of `ADMIN_INITIAL_PASSWORD`) |

### 1.5 Redeploy after env changes

Every time you add or change environment variables in Vercel:

1. Vercel → Project → **Settings → Environment Variables**
2. Save changes
3. **Deployments → Redeploy** (or push a new commit)

> `NEXT_PUBLIC_*` variables are baked into the client bundle at build time — always redeploy after changing them.

### 1.6 Verify deployment

| Check | Expected |
|-------|----------|
| `GET /` | 200 — homepage loads |
| `GET /api/health` | `{ "status": "healthy" }` or `degraded` with database `ok` |
| `GET /login` | Login form |
| `GET /admin` | Redirect to `/login` when logged out |

---

## 2. PostgreSQL production setup

### 2.1 Choose a provider

| Provider | Best for | Connection string |
|----------|----------|-------------------|
| **Neon** | Serverless, generous free tier | Pooled URL with `?sslmode=require` |
| **Vercel Postgres** | Tight Vercel integration | Auto-injected via Storage tab |
| **Supabase** | Full Postgres + extras | **Transaction pooler** URL for serverless |

### 2.2 Create database

**Neon (example):**

1. [console.neon.tech](https://console.neon.tech) → New project
2. Region: **EU** (Frankfurt or Stockholm if available)
3. Copy **Pooled connection string**
4. Append `?sslmode=require` if not present

**Vercel Postgres:**

1. Vercel → Project → **Storage** → Create Database → Postgres
2. Link to project — `DATABASE_URL` is auto-set
3. Use the **pooled** connection string for serverless

**Supabase:**

1. Project Settings → Database → Connection string
2. Select **Transaction pooler** (port 6543)
3. Use `?sslmode=require`

### 2.3 Set `DATABASE_URL` in Vercel

```
postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Scope: **Production** (and Preview if you want a separate preview DB).

### 2.4 Run migrations

```bash
npx prisma migrate deploy
```

This applies all migrations in `prisma/migrations/`. Safe to re-run (idempotent).

### 2.5 Bootstrap admin user

```bash
npx tsx scripts/ensure-admin.ts
```

Creates or updates the admin account. Run once per environment.

### 2.6 Verify database

```bash
npm run db:check
# or after deploy:
curl https://www.ellstorpskrog.se/api/health
```

Expected: database service `ok`, orders/products accessible.

### 2.7 Production database rules

- Always use **SSL** (`sslmode=require`)
- Use **connection pooling** for serverless (Neon pooler, Supabase transaction pooler, Vercel pooled URL)
- Never expose `DATABASE_URL` in client code or commit to Git
- Back up before major migrations (provider snapshot or `pg_dump`)
- Preview deployments should use a **separate** database from production

---

## 3. Domain connection steps

Target domain example: `www.ellstorpskrog.se`

### 3.1 Add domain in Vercel

1. Vercel → Project → **Settings → Domains**
2. Add `www.ellstorpskrog.se`
3. Add apex domain `ellstorpskrog.se` (optional — for redirect)
4. Vercel shows required DNS records — copy exact values

### 3.2 Configure DNS at your registrar

Typical records (verify against Vercel dashboard — values may differ):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |
| `A` | `@` | `76.76.21.21` | 3600 |

**Alternative:** Use Vercel nameservers (transfer DNS to Vercel) for automatic management.

### 3.3 Wait for propagation

- DNS propagation: 5 minutes to 48 hours (usually < 1 hour)
- Vercel auto-provisions **SSL certificate** (Let's Encrypt) once DNS resolves
- Status in Vercel Domains: **Valid Configuration** + **SSL Active**

### 3.4 Set production URL

1. Vercel → Environment Variables → **Production**
2. Set:

```
NEXT_PUBLIC_APP_URL=https://www.ellstorpskrog.se
```

3. **Redeploy** the project

This updates:

- SEO canonical URLs and `sitemap.xml`
- Open Graph / social share previews
- Stripe Checkout success/cancel URLs
- Links in transactional emails

### 3.5 Apex → www redirect (recommended)

In Vercel Domains:

- Set `ellstorpskrog.se` → redirect to `https://www.ellstorpskrog.se`

Ensures one canonical URL for SEO and Stripe webhooks.

### 3.6 Verify domain

| Check | Command / URL |
|-------|---------------|
| HTTPS works | `https://www.ellstorpskrog.se` |
| SSL valid | Browser padlock, no mixed-content warnings |
| Sitemap | `https://www.ellstorpskrog.se/sitemap.xml` — URLs use production domain |
| Robots | `https://www.ellstorpskrog.se/robots.txt` |
| OG preview | [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) |

---

## 4. Stripe live setup steps

### 4.1 Prerequisites

- Stripe account verified for **live payments**
- Business details and bank account connected in Stripe Dashboard
- Production site deployed with HTTPS

### 4.2 Get live API keys

1. [Stripe Dashboard](https://dashboard.stripe.com) → toggle **Live mode** (top right)
2. **Developers → API keys**
3. Copy:
   - **Publishable key** → `pk_live_...`
   - **Secret key** → `sk_live_...`

### 4.3 Set environment variables (Vercel Production)

**Option A — Dual-mode keys (recommended):**

```bash
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...        # from step 4.4
```

**Option B — Legacy single keys:**

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Keys can also be stored in `/admin/payments` (database overrides env when set).

### 4.4 Create live webhook endpoint

1. Stripe Dashboard (Live mode) → **Developers → Webhooks**
2. **Add endpoint**
3. URL:

```
https://www.ellstorpskrog.se/api/webhooks/stripe
```

4. Select events:

   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

5. Copy **Signing secret** (`whsec_...`) → `STRIPE_LIVE_WEBHOOK_SECRET` or `STRIPE_WEBHOOK_SECRET`
6. Redeploy Vercel

### 4.5 Configure in admin

1. Log in → `/admin/payments`
2. Enter **live** secret + publishable keys (Live tab)
3. Enter live webhook signing secret
4. **Disable "Testläge"** (test mode OFF)
5. **Enable "Kortbetalning"** (card payments ON)
6. Save

### 4.6 Verify integration

| Step | Verification |
|------|--------------|
| Checkout API | Place order with card → redirects to Stripe Checkout |
| Webhook | Stripe Dashboard → Webhooks → endpoint shows **200** responses |
| Order status | `/admin/orders` → `paymentStatus: PAID` |
| Emails | Customer + restaurant payment emails received |
| System page | `/admin/system` → Stripe section green, live mode |

### 4.7 Test mode (before going live)

Keep test mode ON during staging:

1. Use test keys (`sk_test_...`, `pk_test_...`)
2. Test card: `4242 4242 4242 4242`, any future expiry, any CVC
3. Create separate **test** webhook endpoint with test signing secret
4. Verify full flow before switching to live

### 4.8 Integration reference

| Endpoint | Purpose |
|----------|---------|
| `POST /api/checkout/create-session` | Create Stripe Checkout Session |
| `GET /api/checkout/session?session_id=` | Verify payment on success page |
| `POST /api/webhooks/stripe` | Process payment events |
| `/admin/payments` | Toggle test/live, enable card payments |

---

## 5. Resend setup steps

### 5.1 Create Resend account

1. [resend.com](https://resend.com) → Sign up
2. **API Keys** → Create key → copy `re_...`

### 5.2 Add and verify sending domain

1. Resend → **Domains → Add Domain**
2. Enter: `ellstorpskrog.se`
3. Resend provides DNS records — add at your registrar:

| Type | Name | Purpose |
|------|------|---------|
| `TXT` | `@` or `_resend` | Domain verification |
| `MX` | `send` (or as shown) | Inbound routing |
| `TXT` | `send` | SPF |
| `CNAME` | `resend._domainkey` | DKIM |

4. Wait for **Verified** status in Resend (can take up to 48h, usually < 1h)

> Website DNS (Vercel) and email DNS (Resend) coexist — they use different record types.

### 5.3 Set environment variables (Vercel Production)

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=no-reply@ellstorpskrog.se
CONTACT_TO_EMAIL=info@ellstorpskrog.se
```

Redeploy after setting.

### 5.4 Configure in admin

1. `/admin/settings` → set **notification email** (restaurant inbox for new orders)
2. `/admin/notifications` → verify sender address matches verified domain
3. Enable **customer emails** and **restaurant emails** toggles

### 5.5 Send test emails

1. Go to `/admin/notifications/test`
2. Send:
   - `CUSTOMER_ORDER_CONFIRMATION`
   - `RESTAURANT_NEW_ORDER`
3. Check inbox (and spam folder)
4. Verify links point to `https://www.ellstorpskrog.se`

### 5.6 Email templates (8 total)

| Trigger | Template |
|---------|----------|
| Order placed (cash) | OrderReceived + RestaurantNewOrder |
| Card payment completed | PaymentReceived + RestaurantPaymentReceived |
| Status → ready | OrderReady |
| Status → delivered | OrderCompleted |
| Status → cancelled | OrderCancelled + RestaurantOrderCancelled |

Failed sends: retry up to 3× via `/admin/notifications` or `POST /api/notifications/retry`.

### 5.7 Verify Resend

| Check | Expected |
|-------|----------|
| Domain status | Verified in Resend Dashboard |
| Test send | Email received, correct branding |
| Live order | Customer + restaurant emails on order |
| `/admin/system` | Email section ≥ 80% |

---

## 6. Environment variable checklist

Set in **Vercel → Settings → Environment Variables → Production**.

### Required (launch blockers)

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Pooled URL for serverless |
| `AUTH_SECRET` | `openssl rand -base64 32` | Min 32 chars, never commit |
| `NEXT_PUBLIC_APP_URL` | `https://www.ellstorpskrog.se` | Must be HTTPS, no trailing slash |
| `STRIPE_SECRET_KEY` * | `sk_live_...` | Or `STRIPE_LIVE_SECRET_KEY` |
| `STRIPE_PUBLISHABLE_KEY` * | `pk_live_...` | Or `STRIPE_LIVE_PUBLISHABLE_KEY` |
| `STRIPE_WEBHOOK_SECRET` * | `whsec_...` | From live webhook endpoint |
| `RESEND_API_KEY` | `re_...` | From Resend Dashboard |
| `RESEND_FROM_EMAIL` | `no-reply@ellstorpskrog.se` | Must be verified domain |
| `CONTACT_TO_EMAIL` | `info@ellstorpskrog.se` | Contact form inbox |

\* For dual-mode setup, use `STRIPE_LIVE_*` + `STRIPE_TEST_*` instead (see below).

### Recommended (dual-mode Stripe)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `STRIPE_TEST_SECRET_KEY` | Preview + Development | Sandbox payments |
| `STRIPE_TEST_PUBLISHABLE_KEY` | Preview + Development | Sandbox client key |
| `STRIPE_TEST_WEBHOOK_SECRET` | Preview + Development | Test webhook verification |
| `STRIPE_LIVE_SECRET_KEY` | Production | Live payments |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | Production | Live client key |
| `STRIPE_LIVE_WEBHOOK_SECRET` | Production | Live webhook verification |

### Optional

| Variable | Purpose |
|----------|---------|
| `ADMIN_INITIAL_PASSWORD` | Override default admin password in `ensure-admin.ts` |
| `AUTH_URL` | Rarely needed — `trustHost: true` handles Vercel |

### Do not set manually

| Variable | Source |
|----------|--------|
| `VERCEL_URL` | Auto-injected by Vercel |
| `VERCEL_ENV` | Auto-injected (`production` / `preview`) |
| `NODE_ENV` | Auto-injected (`production`) |

### Validation commands

```bash
npm run check:env       # all required keys → SET
npm run build           # production build passes
npx tsx scripts/print-readiness.ts   # readiness % + blockers
```

Post-deploy: visit **`/admin/system`** for live readiness dashboard.

### Environment scopes

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `DATABASE_URL` | Production DB | Preview DB | Local Docker / `.env` |
| `AUTH_SECRET` | Unique strong secret | Can share | `.env` |
| `NEXT_PUBLIC_APP_URL` | `https://www.…` | Preview URL | `http://localhost:3000` |
| Stripe keys | **Live** | **Test** | Test |
| Resend | Production key | Same or separate | `.env` |

---

## 7. First production test checklist

Complete these **in order** after first production deploy. Use `LAUNCH_CHECKLIST.md` for a printable version.

### Phase A — Infrastructure

- [ ] Site loads at `https://www.ellstorpskrog.se`
- [ ] SSL certificate valid (no browser warnings)
- [ ] `GET /api/health` returns healthy/degraded with database `ok`
- [ ] `/admin/system` loads (after login)

### Phase B — Auth & admin

- [ ] `/login` → credentials → redirects to `/admin`
- [ ] `/admin` blocked when logged out
- [ ] **Change admin password** from default
- [ ] Logout works

### Phase C — Database & content

- [ ] `/menu` loads products from database
- [ ] `/admin/products` — create/edit product persists after refresh
- [ ] `/admin/categories` — reorder works
- [ ] Image upload works (`/admin/products` → upload)

### Phase D — Orders (cash, no Stripe)

- [ ] Place cash/pickup order on `/menu` → `/checkout`
- [ ] Order appears in `/admin/orders`
- [ ] Customer confirmation email received
- [ ] Restaurant new-order email received

### Phase E — Stripe (test mode first)

- [ ] Enable test mode in `/admin/payments`
- [ ] Card checkout redirects to Stripe
- [ ] Pay with test card `4242 4242 4242 4242`
- [ ] Stripe webhook shows **200** in Dashboard
- [ ] Order `paymentStatus` → **PAID**
- [ ] Payment confirmation emails received

### Phase F — Stripe (live mode)

- [ ] Live keys configured, test mode **OFF**
- [ ] One real payment (minimum amount)
- [ ] Refund test payment in Stripe Dashboard (optional)
- [ ] Webhook 200 on live endpoint

### Phase G — Email & contact

- [ ] `/admin/notifications/test` — both templates delivered
- [ ] `/kontakt` form → email to `CONTACT_TO_EMAIL`
- [ ] Email links use production URL (not localhost)

### Phase H — SEO, PWA & security

- [ ] `/sitemap.xml` — production URLs
- [ ] `/robots.txt` — disallows `/admin/`, `/api/`
- [ ] `/manifest.webmanifest` returns 200
- [ ] OG image resolves (`/hero.jpg` or admin SEO setting)
- [ ] Security headers present (HSTS, X-Frame-Options, nosniff)

### Phase G — Go/no-go

- [ ] `/admin/system` — overall readiness **≥ 80%**
- [ ] **Zero launch blockers** on system page
- [ ] Uptime monitor configured on `/api/health`

---

## 8. Rollback procedure

Use when a deployment causes errors, broken payments, or data issues.

### 8.1 Instant rollback (Vercel — preferred)

**When:** Bad deploy, broken UI, API errors — database unchanged.

1. Vercel → **Deployments**
2. Find the last **known-good** deployment
3. Click **⋯ → Promote to Production**
4. Confirm — traffic switches in ~30 seconds
5. Verify `/api/health` and critical flows

> Rollback reverts **code only**. Environment variables and database are unchanged.

### 8.2 Rollback with env var revert

**When:** Bad env var change (wrong Stripe key, wrong URL).

1. Vercel → **Settings → Environment Variables**
2. Restore previous values (or remove bad entries)
3. **Redeploy** last good deployment (or promote + redeploy)
4. Verify `/admin/system` blockers cleared

### 8.3 Disable payments (emergency)

**When:** Stripe issues, fraudulent charges, webhook failures.

1. `/admin/payments` → **Disable "Kortbetalning"**
2. Cash/pickup orders still work
3. Fix Stripe config or webhook
4. Re-enable when verified

Alternative: Stripe Dashboard → **Live mode → Pause payments** (account-wide).

### 8.4 Disable email (emergency)

**When:** Wrong emails sent, spam complaints, Resend outage.

1. `/admin/notifications` → disable customer + restaurant email toggles
2. Orders still process — emails queued/fail silently in logs
3. Fix Resend config
4. Re-enable toggles; retry failed sends from `/admin/notifications`

### 8.5 Database rollback

**When:** Bad migration, data corruption.

**Prevention:** Take provider snapshot **before** running migrations.

**Neon / Supabase / Vercel Postgres:**

1. Provider dashboard → **Restore from snapshot** (point-in-time recovery)
2. Or create new branch/database and update `DATABASE_URL`
3. Redeploy Vercel

**Never run `prisma migrate reset` in production** — it destroys all data.

### 8.6 Domain rollback

**When:** DNS misconfiguration breaks site.

1. Revert DNS records at registrar to previous values
2. Or temporarily point `www` CNAME back to last working Vercel deployment URL
3. Wait for DNS propagation

### 8.7 Rollback decision matrix

| Symptom | Action | Recovery time |
|---------|--------|---------------|
| Broken UI / 500 errors | Promote previous Vercel deployment | ~1 min |
| Wrong env vars | Revert vars + redeploy | ~5 min |
| Stripe charging issues | Disable card payments in admin | ~1 min |
| Email spam / wrong content | Disable email toggles in admin | ~1 min |
| Bad migration | Restore DB snapshot | 15–60 min |
| DNS broken | Revert DNS records | 5 min–48 h |

### 8.8 Post-rollback verification

- [ ] `GET /api/health` → healthy
- [ ] Homepage + menu load
- [ ] Admin login works
- [ ] Test cash order completes
- [ ] `/admin/system` — no new blockers

---

## Quick reference

```bash
# Local validation
npm run check:env
npm run build
npm run pwa:bootstrap
npm run brand:images

# Production database
npx prisma migrate deploy
npx tsx scripts/ensure-admin.ts

# Readiness report
npx tsx scripts/print-readiness.ts
```

| Resource | URL |
|----------|-----|
| Live site | `https://www.ellstorpskrog.se` |
| Admin | `/admin` |
| System status | `/admin/system` |
| Health API | `/api/health` |
| Stripe webhook | `/api/webhooks/stripe` |

---

*Last updated: 2026-06-09 · Build: `npm run build` passed*
