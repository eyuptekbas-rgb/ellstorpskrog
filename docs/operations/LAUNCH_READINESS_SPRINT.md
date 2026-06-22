# Launch Readiness Sprint Report

**Sprint date:** 15 June 2026  
**Feature freeze:** Active — no new functionality, pages, or UI design  
**Scope:** Production environment, E2E verification, operations, multi-tenant isolation

---

## Executive Summary

| Metric | Score |
|--------|-------|
| **Production readiness** | **38%** |
| **Security** | **78%** (code/tests; live unverified) |
| **Multi-tenant** | **60%** (isolation tests blocked — DB down) |
| **Billing system** | **80%** (unit tests pass; live cron/email unverified) |

### Go / No-Go: **NO-GO**

The platform is **not safe to onboard paying restaurants in production today**. Code quality and automated unit tests are strong, but **production environment is 15% configured**, **PostgreSQL is unreachable**, and **no live E2E path was executed**.

**Recommended:** Complete environment setup on Vercel + managed Postgres, then re-run `npm run launch:sprint` before pilot launch (**target: 1–2 weeks**).

---

## Priority 1: Production Environment

Run: `npm run launch:env`

### Checklist

| Variable | Present | Status | Validated | Notes |
|----------|---------|--------|-----------|-------|
| `DATABASE_URL` | ✅ | validated | ✅ | Format OK — **server unreachable** at verify time |
| `AUTH_SECRET` | ✅ | validated | ✅ | ≥32 chars; accepts `NEXTAUTH_SECRET` alias |
| `AUTH_URL` / `NEXTAUTH_URL` | ❌ | missing | ❌ | Set to production HTTPS URL in Vercel |
| `NEXT_PUBLIC_APP_URL` | ❌ | missing | ❌ | Required for SEO, Stripe redirects |
| `RESEND_API_KEY` | ❌ | missing | ❌ | Email disabled without this |
| `RESEND_FROM_EMAIL` | ❌ | missing | ❌ | |
| `STRIPE_SECRET_KEY` | ❌ | missing | ❌ | Or `STRIPE_TEST_*` / `STRIPE_LIVE_*` |
| `STRIPE_PUBLISHABLE_KEY` | ❌ | missing | ❌ | |
| `STRIPE_WEBHOOK_SECRET` | ❌ | missing | ❌ | |
| `CRON_SECRET` | ❌ | missing | ❌ | Monthly billing cron auth |
| `ORDINA_BILLING_COMPANY` | ❌ | missing | ❌ | |
| `ORDINA_BILLING_EMAIL` | ❌ | missing | ❌ | |
| `ORDINA_BILLING_VAT_RATE` | ❌ | missing | ❌ | |
| `ORDINA_BILLING_ADDRESS` | ❌ | missing | ❌ | Optional |
| `ORDINA_BILLING_ORG_NUMBER` | ❌ | missing | ❌ | Optional |
| `CONTACT_TO_EMAIL` | ❌ | missing | ❌ | Optional |
| `ALERT_WEBHOOK_URL` | ❌ | missing | ❌ | Optional — Slack/Discord webhook |

**Required validated:** 2 / 13

### Configuration actions (Vercel)

1. Copy all variables from `.env.example` into Vercel → Settings → Environment Variables.
2. Set `AUTH_URL` and `NEXTAUTH_URL` to your production domain (e.g. `https://app.ordina.se`).
3. Set `NEXT_PUBLIC_APP_URL` to the same HTTPS origin.
4. Generate `CRON_SECRET` (32+ random chars) — Vercel cron sends `Authorization: Bearer <CRON_SECRET>`.
5. Register Stripe webhook → `https://<domain>/api/webhooks/stripe`.
6. Verify Resend domain (SPF/DKIM).

---

## Priority 2: Production Verification (E2E)

Run: `npm run launch:e2e [baseUrl]`

**Blocked:** PostgreSQL not running (`localhost:5432`). Docker Desktop not available. Dev server not running.

| # | Test | Result | Detail |
|---|------|--------|--------|
| 1 | Login | ⏸ Blocked | Requires DB + running server |
| 2 | Customer creation | ⏸ Blocked | Requires DB |
| 3 | Restaurant creation | ⏸ Blocked | Requires DB |
| 4 | Order placement | ⏸ Blocked | Requires DB |
| 5 | Checkout | ⏸ Blocked | Requires DB + Stripe |
| 6 | Stripe payment | ⏸ Blocked | Manual browser test required |
| 7 | Webhook processing | ⏸ Blocked | Requires Stripe CLI or live event |
| 8 | Reservation creation | ⏸ Blocked | Requires DB |
| 9 | Contact form | ⏸ Blocked | Server not running; Resend missing |
| 10 | Invoice generation | ⏸ Blocked | Requires DB |
| 11 | PDF generation | ✅ Code verified | Unit tests pass; script ready |
| 12 | Invoice email | ⏸ Blocked | `RESEND_API_KEY` missing |
| 13 | Monthly billing run | ⏸ Blocked | Requires DB |

**Unit tests:** ✅ 20/20 pass (`npm run test`)

**Build:** ✅ `npm run build` succeeds

### Re-run procedure (when infra is ready)

```bash
docker compose up -d          # or connect managed Postgres
npx prisma migrate deploy
npm run dev                   # terminal 1
npm run launch:e2e            # terminal 2
```

For Stripe/webhook: use Stripe CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Priority 3: Operations

| Item | Status | Detail |
|------|--------|--------|
| Automated Postgres backups | 🟡 Scripted | `npm run ops:backup` → `backups/*.dump` |
| Backup verified | ❌ | `pg_dump` not installed on verify host; use provider snapshots in production |
| Restore procedure | ✅ Documented | `docs/operations/RESTORE.md` + `npm run ops:restore` |
| Error monitoring | 🟡 | Structured JSON logging via `lib/logging/production-logger.ts` |
| Production logging | ✅ | `logInfo` / `logWarn` / `logError` → stdout (Vercel Logs) |
| Alerting | 🟡 | `ALERT_WEBHOOK_URL` → webhook on errors (optional env) |
| Health endpoint | ✅ | `GET /api/health` |
| Cron schedule | ✅ | `vercel.json` — monthly + overdue jobs |

### Production backup strategy

| Environment | Method |
|-------------|--------|
| **Vercel Postgres / Neon / Supabase** | Enable automated daily snapshots + PITR in provider dashboard |
| **Self-hosted** | Cron: `npm run ops:backup` daily; store `backups/` off-site |

---

## Priority 4: Multi-Tenant Verification

Run: `npm run launch:isolation`

**Blocked:** Database unreachable — only connectivity check ran (FAIL).

### Expected checks (when DB available)

| Isolation rule | Mechanism |
|----------------|-----------|
| Customer A ≠ Customer B orders | `findTenantOrder(id, tenantId)` |
| Invoices isolated | `PlatformInvoice.tenantId` + scoped APIs |
| Reservations isolated | `findTenantReservation` |
| Products isolated | Category `tenantId` join |
| Public settings | No `sk_*` / `whsec_*` in sanitized payload |
| File upload | `/api/admin/upload` requires tenant context |

**Automated security tests (no DB):** ✅ Public settings sanitization, cron auth, pricing errors

---

## Launch Blockers

1. ❌ **11 of 13 required env vars missing** (only `DATABASE_URL` + `AUTH_SECRET` present)
2. ❌ **PostgreSQL unreachable** — no E2E or isolation verification
3. ❌ **Resend not configured** — order emails, billing emails, contact form fail
4. ❌ **Stripe not configured** — card payments and webhooks non-functional
5. ❌ **`CRON_SECRET` missing** — billing cron unauthorized or insecure
6. ❌ **`ORDINA_BILLING_*` missing** — platform invoices incomplete
7. ❌ **No live Stripe payment + webhook test**
8. ❌ **Backup not verified** — provider snapshots or `pg_dump` not confirmed
9. 🟡 **`NEXT_PUBLIC_APP_URL` / `AUTH_URL` missing** — redirect and SEO risk

---

## Sprint Tooling Added (ops only — no product features)

| Command | Purpose |
|---------|---------|
| `npm run launch:env` | Environment checklist |
| `npm run launch:e2e` | E2E verification harness |
| `npm run launch:isolation` | Tenant isolation checks |
| `npm run launch:sprint` | Full sprint + Go/No-Go |
| `npm run ops:backup` | Database backup |
| `npm run ops:restore` | Database restore |

Files: `lib/env/launch-vars.ts`, `scripts/launch/*`, `scripts/ops/*`

---

## Go / No-Go Decision

### **NO-GO** for production paying customers

**Justification:**

- Environment is **15% ready** (2/13 required variables validated).
- Zero live E2E flows completed.
- Email, payments, and billing cron cannot operate without missing secrets.
- Database and backup path unverified in this environment.

### **Conditional GO** for staging pilot after:

1. All 13 required env vars validated (`npm run launch:env` exit 0)
2. `npm run launch:e2e` exit 0 with server + DB running
3. `npm run launch:isolation` exit 0 with ≥2 tenants
4. One successful Stripe test payment + webhook received
5. One billing email sent (`npm run billing:test-email`)
6. Provider backup enabled + one restore drill documented

**Estimated readiness after blockers cleared:** ~85% production, safe for **single-restaurant pilot**.

---

*Re-run this sprint after every production deployment candidate.*
