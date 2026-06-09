# Production Readiness Checklist — Ellstorps Krog

Use this checklist before deploying to production.

## Pre-deploy

- [ ] Set all required environment variables on the host (see `.env.example`)
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Seed or verify admin user: `npx tsx scripts/ensure-admin.ts`
- [ ] Change default admin password (`ChangeMe123!`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain (HTTPS)
- [ ] Configure Stripe **live** keys and webhook endpoint
- [ ] Verify Resend domain + `RESEND_FROM_EMAIL`
- [ ] Hit `/api/health` — expect `healthy` or acceptable `degraded`
- [ ] Run `npm run build` successfully

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Min 32 chars, cryptographically random |
| `NEXT_PUBLIC_APP_URL` | Yes | Public HTTPS URL for SEO, Stripe, emails |
| `STRIPE_SECRET_KEY` | For card payments | Or configure in `/admin/payments` |
| `STRIPE_PUBLISHABLE_KEY` | For card payments | Must match secret key mode |
| `STRIPE_WEBHOOK_SECRET` | For card payments | From Stripe webhook dashboard |
| `RESEND_API_KEY` | For email | Order + contact notifications |
| `RESEND_FROM_EMAIL` | For email | Verified sender in Resend |
| `CONTACT_TO_EMAIL` | For contact form | Restaurant inbox |

## Functional verification

- [ ] **Authentication** — `/login` → `/admin`, logout works
- [ ] **Products** — CRUD in `/admin/products`
- [ ] **Categories** — CRUD + reorder in `/admin/categories`
- [ ] **Orders** — Public POST, admin list/detail, status updates
- [ ] **Checkout** — Cart → checkout → cash order success
- [ ] **Stripe** — Test/live payment + webhook updates order
- [ ] **Email** — Order confirmation + restaurant notification
- [ ] **Admin** — All sidebar pages load

## PWA

- [ ] `/manifest.webmanifest` returns 200
- [ ] `/sw.js` registered in production build
- [ ] PWA icons exist at `/icons/icon-192.png`, `/icons/icon-512.png`
- [ ] `/offline` fallback page works

## SEO

- [ ] `/robots.txt` disallows `/admin`, `/api`, `/checkout`
- [ ] `/sitemap.xml` lists public pages with correct domain
- [ ] OG tags and canonical URLs use production `NEXT_PUBLIC_APP_URL`
- [ ] Admin SEO settings filled in `/admin/seo`

## Monitoring

- [ ] Configure uptime monitor on `/api/health`
- [ ] Review structured JSON logs in production host
- [ ] Stripe webhook delivery logs in Stripe Dashboard

## Post-deploy

- [ ] Smoke test: homepage, menu, checkout, admin login
- [ ] Place test order (Stripe test mode first, then live)
- [ ] Confirm emails received
- [ ] Remove or rotate any dev secrets
