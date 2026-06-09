# Launch Checklist — Ellstorps Krog

Printable go-live checklist. Full details in `DEPLOYMENT_GUIDE.md`.

**Target:** `https://www.ellstorpskrog.se`  
**Go-live gate:** `/admin/system` ≥ 80%, zero blockers

---

## Pre-deploy

- [ ] `npm run build` passes locally
- [ ] `npm run pwa:bootstrap` — icons in `public/icons/`
- [ ] `npm run brand:images` — `public/hero.jpg` exists
- [ ] Code pushed to Git (main/production branch)
- [ ] All 9 required env vars ready (see below)

---

## Vercel

- [ ] Project imported (Next.js, Node 20+)
- [ ] Production env vars set in Vercel
- [ ] First deploy succeeded
- [ ] `npx prisma migrate deploy` run on production DB
- [ ] `npx tsx scripts/ensure-admin.ts` run
- [ ] Custom domain added + DNS configured
- [ ] `NEXT_PUBLIC_APP_URL=https://www.ellstorpskrog.se` set + redeployed
- [ ] SSL active on domain

---

## PostgreSQL

- [ ] Production database provisioned (Neon / Vercel Postgres / Supabase)
- [ ] `DATABASE_URL` uses SSL + pooled connection
- [ ] Migrations applied (`prisma migrate deploy`)
- [ ] Admin user bootstrapped
- [ ] `/api/health` → database `ok`

---

## Domain & DNS

- [ ] `CNAME` `www` → Vercel
- [ ] `A` record `@` → Vercel (or apex redirect)
- [ ] HTTPS works, no certificate warnings
- [ ] `/sitemap.xml` shows production URLs
- [ ] Apex redirects to `www` (optional)

---

## Stripe (live)

- [ ] Live API keys in Vercel (`STRIPE_LIVE_*` or `STRIPE_*`)
- [ ] Webhook endpoint: `https://www.ellstorpskrog.se/api/webhooks/stripe`
- [ ] Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Live webhook secret set in env
- [ ] `/admin/payments` — test mode **OFF**, card payments **ON**
- [ ] Test payment (test mode) → webhook 200 → order PAID
- [ ] One live payment verified (then refund if desired)

---

## Resend

- [ ] Domain `ellstorpskrog.se` added in Resend
- [ ] DNS records verified (SPF, DKIM, MX)
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_TO_EMAIL` set
- [ ] Restaurant notification email in `/admin/settings`
- [ ] Test emails sent from `/admin/notifications/test`
- [ ] Live cash order → customer + restaurant emails received

---

## Environment variables (Production)

| Variable | Set |
|----------|-----|
| `DATABASE_URL` | ☐ |
| `AUTH_SECRET` (≥32 chars) | ☐ |
| `NEXT_PUBLIC_APP_URL` | ☐ |
| `STRIPE_SECRET_KEY` or `STRIPE_LIVE_SECRET_KEY` | ☐ |
| `STRIPE_PUBLISHABLE_KEY` or `STRIPE_LIVE_PUBLISHABLE_KEY` | ☐ |
| `STRIPE_WEBHOOK_SECRET` or `STRIPE_LIVE_WEBHOOK_SECRET` | ☐ |
| `RESEND_API_KEY` | ☐ |
| `RESEND_FROM_EMAIL` | ☐ |
| `CONTACT_TO_EMAIL` | ☐ |

Validate: `npm run check:env` → all required keys `SET`

---

## First production tests

### Auth
- [ ] Login at `/login` → `/admin`
- [ ] Admin password changed from default
- [ ] Logout works; `/admin` blocked when logged out

### Orders
- [ ] Cash order → appears in `/admin/orders`
- [ ] Status update triggers emails
- [ ] Card order → Stripe → PAID → emails

### Content
- [ ] Menu loads products
- [ ] Admin CRUD (products, categories) persists
- [ ] Image upload works

### SEO & PWA
- [ ] `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` → 200
- [ ] OG image on social share debugger
- [ ] Security headers (HSTS, X-Frame-Options)

### System
- [ ] `/admin/system` ≥ **80%** overall
- [ ] **0 launch blockers**
- [ ] Uptime monitor on `/api/health`

---

## Go live

- [ ] Stripe live mode confirmed (not test)
- [ ] All checklist items above complete
- [ ] Restaurant owner notified
- [ ] Rollback plan understood (see `DEPLOYMENT_GUIDE.md` §8)

---

## Rollback (if needed)

- [ ] **Code:** Vercel → Deployments → Promote previous deployment
- [ ] **Env:** Revert variables → redeploy
- [ ] **Payments:** Disable card payments in `/admin/payments`
- [ ] **Email:** Disable toggles in `/admin/notifications`
- [ ] **Database:** Restore provider snapshot (never `migrate reset`)

---

*See `DEPLOYMENT_GUIDE.md` for step-by-step instructions.*
