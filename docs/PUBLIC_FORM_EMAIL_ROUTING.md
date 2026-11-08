# Public form email routing

Production configuration to add/confirm later (not changed by this task):

```dotenv
CONTACT_TO_EMAIL=info@ellstorpskrog.se
RESERVATION_TO_EMAIL=reservation@ellstorpskrog.se
```

Retain the existing server-only `RESEND_API_KEY` and verified `RESEND_FROM_EMAIL`
(normally `no-reply@ellstorpskrog.se`). Never prefix these variables with
`NEXT_PUBLIC_`. No production environment, local secret file, or deployment was changed.

The contact route sends name, email and message only to the contact inbox.
The reservation POST saves the booking and sends name, email, phone, date, time,
guest count, optional comment and booking ID only to the reservation inbox.
Both use the existing Resend client/sender configuration and the customer's
email as Reply-To. HTML values are escaped. Recipients are never supplied by the browser.

When recipient variables are absent, the exact addresses above are the defaults.
A different configured recipient (including swapped inboxes) fails closed.
Missing Resend credentials return 503. Contact delivery failure returns 500;
success returns 200 only when Resend accepts the message.

Reservation configuration is checked before saving. Database failure sends no email.
After a successful save, Resend acceptance returns 201 with `emailNotificationSent: true`.
If delivery fails, the existing booking is retained and the route returns 201 with
`emailNotificationSent: false`, logging `Reservation email delivery failed` and its ID.
The existing booking success UI remains appropriate: the reservation is saved.
This prevents duplicate bookings caused by a customer retrying a saved request.
Monitor that log and follow up using the saved reservation. There is no automatic
email retry worker in this change. A booking ID is used as Resend's idempotency key.
Resend acceptance does not guarantee final inbox delivery.

Tests mock Resend and persistence; browser tests intercept both form endpoints.
No test should send a real email or save a real booking.

## Contact page freeze

The public Contact page is APPROVED AND FROZEN by the user. Preserve its design,
layout, spacing, typography, map, opening hours, responsive behavior and form
structure in future development unless the user explicitly requests a change.
Email-routing changes are server-side only; Contact and reservation UI files are untouched.
