# Ellstorps Google reviews

No pre-existing Google review integration or verified Place ID was found.
The homepage now reads the official Google Business Profile v4 reviews endpoint:
`https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews`.
It never scrapes Maps or uses invented fallback reviews.

Production values to configure later (no production environment changed):

```dotenv
GOOGLE_BUSINESS_CLIENT_ID=<OAuth client ID>
GOOGLE_BUSINESS_CLIENT_SECRET=<OAuth client secret>
GOOGLE_BUSINESS_REFRESH_TOKEN=<owner-authorized offline refresh token>
GOOGLE_BUSINESS_LOCATION=accounts/<accountId>/locations/<locationId>
GOOGLE_MAPS_PLACE_ID=<optional verified Ellstorps Place ID>
```

Use a Google Cloud project with approved Business Profile API access and owner or
manager authorization for the verified Ellstorps Kvarterskrog location at
Sallerupsvägen 28D, Malmö. Authorize the `https://www.googleapis.com/auth/business.manage`
scope with offline access. This implementation performs only review reads.
A Places API key alone cannot authenticate this endpoint. No second customer
authentication system is introduced. Do not prefix any credential with `NEXT_PUBLIC_`.

Confirm the account/location belongs to Ellstorps before setting it. No account ID,
location ID, Place ID, author or review text is guessed. Until credentials exist,
live review identity/text verification is blocked and the homepage shows only
“Se våra recensioner på Google”, linking to a Maps search for the exact restaurant
and street. The optional verified Place ID targets the precise listing.

Google's `FIVE` enum is normalized to numeric `rating: 5`. All other ratings,
missing author names, anonymous authors and blank comments are excluded. Select
at most three distinct IDs/texts, most recently updated first. The source text
and author name are preserved; no photos, profile metadata or owner replies are
sent to the browser. The section is labeled as selected five-star Google Maps
reviews, not an unfiltered or representative overall rating.

Fetch at most three pages of 50 recent reviews with a three-second total deadline.
Cache the selected public display data in server memory for one hour; coalesce
concurrent requests. Failures clear stale data and back off for five minutes.
Each server instance has its own cache; cold starts may refetch. Cache is never
persisted to disk or sent to a browser data endpoint. Expired entries are not
served. Calls run alongside the homepage's existing data loading, with no client
fetch or polling. Missing configuration performs no Google requests.

Business Profile was chosen over Places to support recent review pagination and
limited temporary performance caching. Google allows limited temporary content
storage for performance, up to 30 days. This implementation uses one hour.
Disable the credentials and restart instances if access is revoked.

Sources:
- https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- https://developers.google.com/my-business/content/policies
- https://developers.google.com/my-business/content/review-data

Run `npx tsx --test tests/home/google-reviews.test.ts tests/email/public-forms.test.ts`.
All review/email fixtures are synthetic and test-only. No live emails or bookings
are produced. Verify actual author/text matches after production credentials are
provided, before publishing. Contact page freeze is recorded in `AGENTS.md`.
