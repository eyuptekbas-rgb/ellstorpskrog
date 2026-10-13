# Public feature verification — 9 September 2026

No deployment, commit, production environment edit, real email or real reservation
was performed. Contact page design and reservation UI were not edited.

## Files changed in this pass

- `app/(site)/page.tsx`
- `app/(site)/HomeClient.tsx`
- `components/concepts/home/ConceptHomeLayouts.tsx`
- `components/home/Reviews.tsx`
- `components/Header.tsx`
- `components/header/HeaderActions.tsx`
- `lib/home/google-review-data.ts` (new)
- `lib/home/google-reviews.ts` (new)
- `app/api/contact/route.ts`
- `app/api/reservations/route.ts` (public POST only; staff GET unchanged)
- `lib/email/public-forms.ts` (new)
- `lib/reservations/submit.ts` (new)
- `.env.example` (example values only; ignored by this repository's env pattern)
- `scripts/check-env.ts`
- `package.json` (`test:public` script)
- `tests/email/public-forms.test.ts` (new)
- `tests/home/google-reviews.test.ts` (new)
- `tests/security/customer-account-routing.test.ts` (new)
- `scripts/verify-public-final.mjs` (new)
- `AGENTS.md` (new; Contact freeze)
- `docs/PUBLIC_FORM_EMAIL_ROUTING.md` (new)
- `docs/GOOGLE_REVIEWS_SETUP.md` (new)
- `docs/PUBLIC_FINAL_VERIFICATION.md` (new)
- `screenshots/public-final/` (browser reports/captures)
- `screenshots/restaurant-hero/` (refreshed verification captures)

All other pre-existing working-tree changes were preserved.

## Results

- `npm run test:public`: 19 passed. Tests cover exact recipients, anti-swap guards,
  all collected email fields, HTML escaping, validation, delivery failures,
  database failure, saved-booking preservation, Google-only rating normalization,
  max-three selection/deduplication, caching, pagination, graceful failure,
  customer login/account routing with an isolated JWT secret, and required sauce selection.
- `node scripts/verify-public-final.mjs`: passed at 1280 and 1440px on homepage,
  menu, Contact, and reservation flow. Header controls stay within the header
  without overlap. Contact and reservation failure/success states work against
  intercepted responses. No POST reaches the real application.
- `node scripts/verify-home-hero.mjs`: passed at 390, 430, 820, 1280 and 1440px.
  Supplied hero image remains optimized, signage visible, CTAs clickable and above
  the fold, with no horizontal overflow. Existing mobile header behavior retained.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Generated development client chunks contain none of the Google OAuth secret
  configuration or server email recipient variable names.

The header logo previously created a nested anchor because `href={undefined}`
activated its default link. Passing an empty href keeps the existing outer link
and prevents the invalid initial HTML/layout without changing the approved appearance.

## Remaining configuration limits

Google Business Profile credentials and the verified account/location identifier
are missing. Therefore the live homepage currently shows the neutral Google link,
not fabricated cards. Real author/text comparison and a live three-review visual
check require that access. Filtering/cache tests use labeled synthetic fixtures
that are never imported into production code. Source and setup are documented in
`GOOGLE_REVIEWS_SETUP.md`.

Email transport is verified through mocked Resend calls, not live delivery.
Set the documented production inbox variables later and retain the verified
Resend sender and API key. Reservation notification failures after persistence
retain the booking, emit an ID-only failure log and return `emailNotificationSent: false`;
operations must follow up from that saved booking (no automatic retry worker added).

Contact is approved and frozen as instructed in `AGENTS.md`. Existing generic
fallback restaurant data and live menu configuration were not modified; sauce
frontend/server validation and its regression tests remain intact.
