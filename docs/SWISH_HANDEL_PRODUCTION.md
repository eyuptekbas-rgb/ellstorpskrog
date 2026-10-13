# Direct Swish Handel

This flow uses Swish directly over Node HTTPS/mTLS. It does not call Stripe.
The existing checkout selector includes Swish only when server configuration is
complete. The customer approves the request in Swish on the Swedish mobile
number entered in checkout. The existing confirmation view waits for payment.

## Configuration to add later

No production environment or existing tenant settings were changed in this pass.

- `SWISH_MERCHANT_NUMBER`: contracted 10-digit merchant alias starting with 123,
  unless set in the tenant's existing `BusinessPaymentSettings.swishMerchantNumber`.
- `SWISH_CERT_PEM` or `SWISH_CERT_PATH`: PEM client certificate/chain.
- `SWISH_KEY_PEM` or `SWISH_KEY_PATH`: matching PEM private key.
- `SWISH_KEY_PASSPHRASE`: only if the private key is encrypted.
- `SWISH_CA_PEM` or `SWISH_CA_PATH`: official Swish TLS trust chain if required
  by the environment. Never disable certificate verification.
- `SWISH_CALLBACK_SECRET`: a locally generated random secret of at least 32
  characters. Used for separate per-payment callback and status tokens.
- `SWISH_APP_URL`: public HTTPS application origin, or existing
  `NEXT_PUBLIC_APP_URL` when it is the correct public HTTPS origin.
- `DATABASE_URL`: existing PostgreSQL configuration.
- Existing tenant `BusinessPaymentSettings.swishEnabled=true` and `isLive=true`
  are required to offer production Swish. Do not enable until certificates and
  merchant alias are verified.
- Optional `SWISH_API_BASE_URL` must exactly match the selected environment:
  `https://cpc.getswish.net` for live, `https://mss.cpc.getswish.net` for test.
  Omitting it selects the appropriate endpoint from `isLive`.

Creation uses `PUT /swish-cpcapi/api/v2/paymentrequests/{instructionUUID}`.
Status lookup and cancellation retain v1 GET/PATCH, as documented by Swish.
Source: https://developer.swish.nu/ (v1 creation retirement notice).

## Obtain from the bank / Swish

An activated Swish Handel agreement and its merchant alias; access to issue the
merchant API client certificate; the corresponding official certificate chain
and test credentials/certificates for MSS. Generate and retain the private key
securely when creating the certificate request. Keep test/live material separate.
A reachable public HTTPS callback and outbound mTLS connectivity are also needed.
Source: https://developer.swish.nu/

## Persistence and confirmation

- Order pricing and required options use the existing server catalog validator.
- The service checks tenant, order amount, currency SEK, and duplicate active
  payments under an order lock. The unique 32-character instruction UUID is
  persisted before the PUT; payeePaymentReference is the internal payment ID.
- Creation never marks an order paid. Ambiguous network/server failures retain
  the pending instruction and its status URL, rather than inventing success or
  issuing another payment.
- POST/PUT `/api/webhooks/swish` validates a per-payment token and then queries
  Swish with mTLS. Callback body values cannot mark a payment paid.
- Verified ID, merchant alias, amount, currency, and internal reference must match.
- Event, payment, and order updates commit in one PostgreSQL transaction. Duplicate
  callbacks and late failures cannot downgrade PAID; failed transactions can retry.
- `/api/checkout/swish` exposes only availability, or a token-protected payment
  result scoped to the current tenant. Pending polling can recover a missed callback.
- Confirmed orders retain method SWISH for existing POS/admin/order displays.
  Customer receipts print Swish only for persisted SWISH + PAID.
- The old unconfirmed refund implementation is blocked. A separately verified
  refund flow is outside this payment pass; use the bank's supported process.

## Local verification

Run with Node 24 (the integration test uses Node module hooks):

```text
node --import tsx --test tests/payment/swish-production.test.ts tests/payment/swish-flow.test.ts
node scripts/verify-swish-checkout.mjs
npm run typecheck
npm run lint
git diff --check
```

The integration tests require a loopback PostgreSQL database. They create an
isolated temporary tenant/catalog/orders, mock HTTPS and TLS test material, and
remove all fixtures afterward. Browser tests mock payment creation/status and
send no real payment or order. The TLS mock does not certify real bank credentials.

Local inspection found no Swish alias, TLS certificate/key, or callback secret;
both existing payment-settings rows had Swish disabled. No real Swish transaction
or bank certificate handshake has been performed. Live acceptance remains blocked
until the above configuration and an explicitly authorized test payment exist.

Keep certificates/keys in a secret manager or protected files outside `public/`.
Never use `NEXT_PUBLIC_` for Swish credentials. PEM/key/P12/PFX/CRT/CER files and
environment files are ignored by Git; none were tracked at verification time.
