import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env optional when vars are injected by host
  }
}

loadEnvFile();

const keys = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_TEST_SECRET_KEY",
  "STRIPE_TEST_PUBLISHABLE_KEY",
  "STRIPE_TEST_WEBHOOK_SECRET",
  "STRIPE_LIVE_SECRET_KEY",
  "STRIPE_LIVE_PUBLISHABLE_KEY",
  "STRIPE_LIVE_WEBHOOK_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
] as const;

let hasIssue = false;

for (const key of keys) {
  const v = process.env[key]?.trim() ?? "";
  let status = "MISSING";
  if (v) {
    if (key === "AUTH_SECRET" && v.length < 32) status = "WEAK";
    else if (key === "AUTH_SECRET" && /change-me/i.test(v)) status = "WEAK";
    else if (key === "NEXT_PUBLIC_APP_URL" && v.includes("localhost"))
      status = "LOCAL";
    else status = "SET";
  }
  if (
    status === "MISSING" &&
    ["DATABASE_URL", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL"].includes(key)
  ) {
    hasIssue = true;
  }
  if (status === "WEAK") hasIssue = true;
  console.log(`${key}=${status}`);
}

if (hasIssue) {
  process.exitCode = 1;
}
