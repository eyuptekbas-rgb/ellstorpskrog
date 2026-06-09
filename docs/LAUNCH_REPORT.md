# Final Launch Report — Ellstorps Krog

**Generated:** 2026-06-09  
**Build:** `npm run build` — **PASSED**  
**Environment:** Local development (pre-Vercel)

**Master docs:** `DEPLOYMENT_GUIDE.md` · `LAUNCH_CHECKLIST.md`

---

## Launch readiness

| Metric | Score |
|--------|-------|
| **Overall launch readiness** | **69%** |
| Stripe readiness | 41% |
| Email readiness | 80% |

**Recommendation: Do not go live yet.** Resolve blockers below, then re-check `/admin/system`.

---

## Remaining blockers

1. **`NEXT_PUBLIC_APP_URL` saknas** — SEO, Stripe redirects, and emails will use wrong domain
2. **`RESEND_API_KEY` saknas** — transactional email disabled
3. **Stripe-nycklar saknas** — card payments disabled

### Missing environment variables (local)

| Variable | Status |
|----------|--------|
| `DATABASE_URL` | SET |
| `AUTH_SECRET` | SET |
| `NEXT_PUBLIC_APP_URL` | **MISSING** |
| `STRIPE_SECRET_KEY` | **MISSING** |
| `STRIPE_PUBLISHABLE_KEY` | **MISSING** |
| `STRIPE_WEBHOOK_SECRET` | **MISSING** |
| `STRIPE_TEST_*` / `STRIPE_LIVE_*` | **MISSING** |
| `RESEND_API_KEY` | **MISSING** |
| `RESEND_FROM_EMAIL` | **MISSING** |
| `CONTACT_TO_EMAIL` | **MISSING** |

---

## Build verification

```
npm run build — PASSED (Next.js 16.1.6, webpack)
49 routes compiled
PWA service worker generated → public/sw.js
TypeScript check passed
```

---

## Go live recommendation

### Status: NOT READY (69%)

**Before go-live (~2–4 hours setup):**

1. Follow `DEPLOYMENT_GUIDE.md` sections 1–6
2. Set all 9 required Vercel environment variables
3. Run `npm run pwa:bootstrap` and `npm run brand:images`; commit assets
4. Deploy to Vercel + run `prisma migrate deploy`
5. Configure Stripe live webhook + disable test mode
6. Verify Resend domain DNS
7. Complete `LAUNCH_CHECKLIST.md`
8. Confirm `/admin/system` ≥ **80%** with **0 blockers**

**After blockers resolved:** Safe to go live on `https://www.ellstorpskrog.se` with monitoring on `/api/health`.

---

## Reference

| Document | Purpose |
|----------|---------|
| `DEPLOYMENT_GUIDE.md` | Complete deployment guide (8 sections) |
| `LAUNCH_CHECKLIST.md` | Printable go-live checklist |
| `PRODUCTION_ENVIRONMENT.md` | Variable reference |
| `PRODUCTION_SETUP.md` | Stripe + Resend detailed setup |
| `/admin/system` | Live readiness dashboard |
