/** Check env var presence without printing secrets */
const VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "STRIPE_TEST_SECRET_KEY",
  "STRIPE_TEST_PUBLISHABLE_KEY",
  "STRIPE_TEST_WEBHOOK_SECRET",
  "STRIPE_LIVE_SECRET_KEY",
  "STRIPE_LIVE_PUBLISHABLE_KEY",
  "STRIPE_LIVE_WEBHOOK_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "ADMIN_INITIAL_PASSWORD",
  "DEFAULT_TENANT_SLUG",
  "NEXT_PUBLIC_DEFAULT_TENANT_SLUG",
];

for (const key of VARS) {
  const val = process.env[key];
  let status = "MISSING";
  if (val?.trim()) {
    if (key.includes("SECRET") || key.includes("KEY") || key.includes("PASSWORD") || key === "DATABASE_URL") {
      status = `SET (${val.length} chars)`;
    } else {
      status = `SET = ${val}`;
    }
    if (key === "AUTH_SECRET" && val.length < 32) status += " [WARNING: <32 chars]";
    if (/change-me/i.test(val)) status += " [WARNING: placeholder]";
  }
  console.log(`${key}: ${status}`);
}
