# Production Setup Guide — Ellstorps Krog

Complete guide for launching payments (Stripe) and transactional email (Resend) on Vercel.

## Quick links

| Resource | URL |
|----------|-----|
| System status dashboard | `/admin/system` |
| Stripe settings | `/admin/payments` |
| Email settings | `/admin/notifications` |
| Email test sends | `/admin/notifications/test` |
| Health API | `/api/health` |
| Env checklist | `docs/PRODUCTION_ENV_CHECKLIST.md` |

---

## 1. Environment variables

Set these in Vercel → Project → Settings → Environment Variables.

### Required (launch blockers)

```bash
DATABASE_URL=postgresql://...?sslmode=require
AUTH_SECRET=                    # openssl rand -base64 32
NEXT_PUBLIC_APP_URL=https://www.ellstorpskrog.se
```

### Stripe — dual mode (recommended)

```bash
# Test (sandbox)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...

# Live (production)
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
```

Legacy single-key fallback (applies to active mode only):

```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Keys can also be stored in `/admin/payments` (database overrides env).

### Resend

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=no-reply@ellstorpskrog.se
CONTACT_TO_EMAIL=info@ellstorpskrog.se
```

Verify your sending domain in [Resend Dashboard](https://resend.com/domains) before go-live.

---

## 2. Database & admin

```bash
npx prisma migrate deploy
npx tsx scripts/ensure-admin.ts
```

1. Log in at `/login` (`admin@ellstorpskrog.se`)
2. Change the default password immediately
3. Set restaurant email under `/admin/settings` (notification inbox)

---

## 3. Stripe setup

### Integration points (verified in codebase)

| Step | Endpoint / file |
|------|-----------------|
| Create Checkout Session | `POST /api/checkout/create-session` |
| Verify on success page | `GET /api/checkout/session?session_id=` |
| Webhook handler | `POST /api/webhooks/stripe` |
| Payment status update | `lib/orders/payment.ts` → `markOrderPaid` / `markOrderPaymentFailed` |
| Admin test/live toggle | `/admin/payments` → `stripeTestMode` |

### Webhook configuration

Create **two** endpoints in Stripe Dashboard (test + live):

```
https://www.ellstorpskrog.se/api/webhooks/stripe
```

**Events to listen for:**

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Copy each signing secret into `/admin/payments` or env (`STRIPE_TEST_WEBHOOK_SECRET` / `STRIPE_LIVE_WEBHOOK_SECRET`).

The webhook handler tries all configured secrets so test and live events both verify correctly.

### Test → Live switch

1. Add live keys in `/admin/payments` (Live tab fields) or env
2. Create live webhook endpoint + copy signing secret
3. **Uncheck "Testläge"** in `/admin/payments`
4. Enable **Kortbetalning**
5. Confirm `/admin/system` shows Stripe live mode and no blockers

### Test payment (sandbox)

1. Ensure test mode is ON
2. Place order with card → use Stripe test card `4242 4242 4242 4242`
3. Confirm order shows `paymentStatus: PAID` in `/admin/orders`
4. Check Stripe Dashboard → Webhooks for successful delivery

---

## 4. Resend email setup

### Templates (8 React Email components)

| Type | Template file |
|------|---------------|
| Customer order confirmation | `emails/OrderReceived.tsx` |
| Customer payment confirmation | `emails/PaymentReceived.tsx` |
| Customer order ready | `emails/OrderReady.tsx` |
| Customer order delivered | `emails/OrderCompleted.tsx` |
| Customer order cancelled | `emails/OrderCancelled.tsx` |
| Restaurant new order | `emails/RestaurantNewOrder.tsx` |
| Restaurant payment received | `emails/RestaurantPaymentReceived.tsx` |
| Restaurant order cancelled | `emails/RestaurantOrderCancelled.tsx` |

### When emails are sent

| Trigger | Emails |
|---------|--------|
| Cash/pickup order created | Customer confirmation + restaurant new order |
| Card payment completed | Customer confirmation + payment confirmation + restaurant new order + restaurant payment |
| Status → ready/delivered/cancelled | Matching customer + restaurant templates |

### Failed email retry

- Max **3 retries** per log entry (`lib/email/notifications/retry.ts`)
- Manual retry: `/admin/notifications` → failed log → **Försök igen**
- Bulk retry: `POST /api/notifications/retry` with `{ "retryAll": true }`

### Test emails

1. Go to `/admin/notifications/test`
2. Send `CUSTOMER_ORDER_CONFIRMATION` and `RESTAURANT_NEW_ORDER` to your inbox
3. Verify rendering and links

---

## 5. Pre-deploy checklist

```bash
npm run check:env
npm run build
```

Visit `/admin/system` and resolve all **launch blockers**.

---

## 6. Post-deploy verification

- [ ] `GET /api/health` returns `healthy` or acceptable `degraded`
- [ ] `/admin/system` — overall readiness ≥ 80%, Stripe & email green
- [ ] Test card payment (test mode) → webhook 200 → order PAID
- [ ] Test email from `/admin/notifications/test`
- [ ] Cash order → confirmation emails received
- [ ] Switch to live mode only when ready for real charges

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook 400 Invalid signature | Wrong signing secret for test/live mode |
| Emails not sending | Check `RESEND_API_KEY`, domain verification, `/admin/notifications` toggles |
| Order stuck PENDING | Check webhook logs; success page polls `/api/checkout/session` as fallback |
| Stripe test mode in production | `/admin/system` blocker — disable test mode |
