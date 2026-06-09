# Vercel Deployment Checklist — Ellstorps Krog

Use this checklist when deploying to Vercel. No code changes required — configuration and verification only.

**Related docs:** `DEPLOYMENT_GUIDE.md` (complete guide) · `LAUNCH_CHECKLIST.md` · `PRODUCTION_ENVIRONMENT.md` · `PRODUCTION_SETUP.md` · `LAUNCH_REPORT.md`

---

## Phase 1 — Repository & Vercel project

- [ ] Push latest code to GitHub/GitLab
- [ ] Create Vercel project → Import repository
- [ ] Framework preset: **Next.js**
- [ ] Root directory: project root (contains `package.json`)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)
- [ ] Node.js version: **20.x** or **22.x**

---

## Phase 2 — Database (PostgreSQL)

- [ ] Provision PostgreSQL (Vercel Postgres, Neon, or Supabase)
- [ ] Copy connection string → `DATABASE_URL` in Vercel env
- [ ] Ensure `?sslmode=require` for hosted Postgres
- [ ] After first deploy, run migrations:

```bash
npx prisma migrate deploy
```

- [ ] Bootstrap admin (one-time):

```bash
npx tsx scripts/ensure-admin.ts
```

- [ ] Verify: `GET /api/health` → database `ok`

---

## Phase 3 — Environment variables

Set in **Vercel → Settings → Environment Variables** for **Production**:

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Yes |
| `AUTH_SECRET` | Yes |
| `NEXT_PUBLIC_APP_URL` | Yes |
| `STRIPE_SECRET_KEY` | Yes (card payments) |
| `STRIPE_PUBLISHABLE_KEY` | Yes (card payments) |
| `STRIPE_WEBHOOK_SECRET` | Yes (card payments) |
| `RESEND_API_KEY` | Yes (email) |
| `RESEND_FROM_EMAIL` | Yes (email) |
| `CONTACT_TO_EMAIL` | Yes (contact form) |

See `PRODUCTION_ENVIRONMENT.md` for values and examples.

- [ ] Run `npm run check:env` locally with production values before deploy
- [ ] Redeploy after adding/changing env vars

---

## Phase 4 — Domain & DNS

- [ ] Add custom domain in Vercel (e.g. `www.ellstorpskrog.se`)
- [ ] Point DNS to Vercel (see `LAUNCH_REPORT.md` DNS section)
- [ ] Set `NEXT_PUBLIC_APP_URL=https://www.ellstorpskrog.se`
- [ ] Wait for SSL certificate (automatic on Vercel)
- [ ] Enable redirect: apex → `www` (optional, in Vercel domain settings)

---

## Phase 5 — Stripe (production)

- [ ] Add **live** API keys in Vercel env or `/admin/payments`
- [ ] Create Stripe webhook endpoint:

```
https://www.ellstorpskrog.se/api/webhooks/stripe
```

- [ ] Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Copy signing secret → `STRIPE_WEBHOOK_SECRET`
- [ ] In `/admin/payments`: disable **Testläge**, enable **Kortbetalning**
- [ ] Test one live payment (small amount) before announcing

---

## Phase 6 — Resend (email)

- [ ] Add domain in Resend Dashboard
- [ ] Configure DNS records (SPF, DKIM, MX — see `LAUNCH_REPORT.md`)
- [ ] Set `RESEND_FROM_EMAIL` to verified address
- [ ] Set restaurant notification email in `/admin/settings`
- [ ] Send test emails from `/admin/notifications/test`

---

## Phase 7 — Assets & PWA (pre-deploy)

Run locally and commit generated assets, or run in CI before build:

```bash
npm run pwa:bootstrap    # generates /public/icons/*.png
npm run brand:images     # generates hero + category images
```

- [ ] `public/icons/icon-192.png` exists
- [ ] `public/icons/icon-512.png` exists
- [ ] `public/icons/icon-512-maskable.png` exists
- [ ] `public/icons/apple-touch-icon.png` exists
- [ ] `public/hero.jpg` exists (OG fallback)

---

## Phase 8 — Functional verification (post-deploy)

### Auth.js
- [ ] `/login` → credentials → `/admin`
- [ ] `/admin` blocked when logged out
- [ ] Logout works
- [ ] Admin password changed from default

### PostgreSQL
- [ ] Menu loads products from DB
- [ ] Admin CRUD persists

### Stripe
- [ ] Checkout with card redirects to Stripe
- [ ] Webhook returns 200 in Stripe Dashboard
- [ ] Order `paymentStatus` → `PAID`

### Resend
- [ ] Cash order → customer + restaurant emails
- [ ] Card payment → confirmation emails

### Orders
- [ ] Public `POST /api/orders` (cash)
- [ ] Admin list at `/admin/orders`
- [ ] Status update sends emails

### Products & Categories
- [ ] `/admin/products` — list, create, edit, delete
- [ ] `/admin/categories` — reorder works
- [ ] `/menu` reflects changes

### Admin
- [ ] All sidebar pages load without error
- [ ] `/admin/system` shows readiness ≥ 80%

---

## Phase 9 — SEO, PWA & security

### sitemap.xml
- [ ] `GET /sitemap.xml` returns 200
- [ ] URLs use production domain (not localhost)
- [ ] Includes `/`, `/menu`, `/kontakt`, `/reservation`

### robots.txt
- [ ] `GET /robots.txt` returns 200
- [ ] Disallows `/admin/`, `/api/`, `/checkout`
- [ ] References `sitemap.xml`

### PWA
- [ ] `GET /manifest.webmanifest` returns 200
- [ ] `GET /sw.js` returns 200 (production build only)
- [ ] `/offline` page loads
- [ ] Install prompt works on mobile (optional)

### Metadata & Open Graph
- [ ] Page titles use restaurant name
- [ ] `/admin/seo` settings filled
- [ ] OG image resolves (default `/hero.jpg` or custom in admin)
- [ ] Share preview shows correct image on Facebook/WhatsApp debugger

### Security headers
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Strict-Transport-Security` present (HTTPS)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

Verify with browser DevTools → Network → response headers, or [securityheaders.com](https://securityheaders.com).

---

## Phase 10 — Go live

- [ ] `/admin/system` — zero launch blockers
- [ ] Uptime monitor on `/api/health`
- [ ] Stripe Dashboard — live mode, webhook healthy
- [ ] Resend — domain verified, test email received
- [ ] Announce site to restaurant owner

---

## Quick commands

```bash
npm run check:env
npm run build
npx prisma migrate deploy
npx tsx scripts/ensure-admin.ts
npx tsx scripts/print-readiness.ts   # if available
```
