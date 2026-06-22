import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type EnvCheckStatus = "present" | "missing" | "weak" | "validated" | "invalid";

export type EnvCheckItem = {
  key: string;
  aliases: string[];
  present: boolean;
  status: EnvCheckStatus;
  validated: boolean;
  validationNote?: string;
  requiredForLaunch: boolean;
};

export function loadDotEnv(): void {
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
    // optional when host injects env
  }
}

/** Normalize NextAuth v4 env names to Auth.js v5 names used in this repo. */
export function normalizeAuthEnv(): void {
  if (!process.env.AUTH_SECRET?.trim() && process.env.NEXTAUTH_SECRET?.trim()) {
    process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET.trim();
  }
  if (!process.env.AUTH_URL?.trim() && process.env.NEXTAUTH_URL?.trim()) {
    process.env.AUTH_URL = process.env.NEXTAUTH_URL.trim();
  }
}

function readEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

function isStripeSecret(value: string): boolean {
  return /^sk_(test|live)_[A-Za-z0-9]+$/.test(value);
}

function isStripePublishable(value: string): boolean {
  return /^pk_(test|live)_[A-Za-z0-9]+$/.test(value);
}

function isWebhookSecret(value: string): boolean {
  return value.startsWith("whsec_") && value.length > 12;
}

function isResendKey(value: string): boolean {
  return value.startsWith("re_") && value.length > 10;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isDatabaseUrl(value: string): boolean {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export const LAUNCH_ENV_SPECS: Array<{
  key: string;
  aliases: string[];
  requiredForLaunch: boolean;
  validate: (value: string) => { ok: boolean; note?: string };
}> = [
  {
    key: "DATABASE_URL",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) =>
      isDatabaseUrl(v)
        ? { ok: true, note: "PostgreSQL connection string format OK" }
        : { ok: false, note: "Must start with postgresql:// or postgres://" },
  },
  {
    key: "AUTH_SECRET",
    aliases: ["NEXTAUTH_SECRET"],
    requiredForLaunch: true,
    validate: (v) => {
      if (v.length < 32) return { ok: false, note: "Must be at least 32 characters" };
      if (/change-me/i.test(v)) return { ok: false, note: "Placeholder value detected" };
      return { ok: true, note: "Length and format OK" };
    },
  },
  {
    key: "AUTH_URL",
    aliases: ["NEXTAUTH_URL"],
    requiredForLaunch: true,
    validate: (v) => {
      try {
        const url = new URL(v);
        if (url.protocol !== "https:" && !/localhost|127\.0\.0\.1/.test(v)) {
          return { ok: false, note: "Production URL should use HTTPS" };
        }
        return { ok: true, note: `URL OK (${url.origin})` };
      } catch {
        return { ok: false, note: "Invalid URL" };
      }
    },
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) =>
      isHttpsUrl(v) || /localhost|127\.0\.0\.1/.test(v)
        ? { ok: true, note: isHttpsUrl(v) ? "HTTPS production URL" : "Local dev URL" }
        : { ok: false, note: "Invalid URL" },
  },
  {
    key: "RESEND_API_KEY",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) =>
      isResendKey(v)
        ? { ok: true, note: "Resend key format OK" }
        : { ok: false, note: "Expected re_* key" },
  },
  {
    key: "RESEND_FROM_EMAIL",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) =>
      isEmail(v) ? { ok: true, note: "Email format OK" } : { ok: false, note: "Invalid email" },
  },
  {
    key: "STRIPE_SECRET_KEY",
    aliases: ["STRIPE_TEST_SECRET_KEY", "STRIPE_LIVE_SECRET_KEY"],
    requiredForLaunch: true,
    validate: (v) =>
      isStripeSecret(v)
        ? { ok: true, note: "Stripe secret key format OK" }
        : { ok: false, note: "Expected sk_test_* or sk_live_*" },
  },
  {
    key: "STRIPE_PUBLISHABLE_KEY",
    aliases: ["STRIPE_TEST_PUBLISHABLE_KEY", "STRIPE_LIVE_PUBLISHABLE_KEY"],
    requiredForLaunch: true,
    validate: (v) =>
      isStripePublishable(v)
        ? { ok: true, note: "Stripe publishable key format OK" }
        : { ok: false, note: "Expected pk_test_* or pk_live_*" },
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    aliases: ["STRIPE_TEST_WEBHOOK_SECRET", "STRIPE_LIVE_WEBHOOK_SECRET"],
    requiredForLaunch: true,
    validate: (v) =>
      isWebhookSecret(v)
        ? { ok: true, note: "Webhook secret format OK" }
        : { ok: false, note: "Expected whsec_*" },
  },
  {
    key: "CRON_SECRET",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) =>
      v.length >= 24
        ? { ok: true, note: "Cron secret length OK" }
        : { ok: false, note: "Use at least 24 random characters" },
  },
  {
    key: "ORDINA_BILLING_COMPANY",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) => (v.length >= 2 ? { ok: true } : { ok: false, note: "Company name required" }),
  },
  {
    key: "ORDINA_BILLING_EMAIL",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) =>
      isEmail(v) ? { ok: true, note: "Billing email OK" } : { ok: false, note: "Invalid email" },
  },
  {
    key: "ORDINA_BILLING_VAT_RATE",
    aliases: [],
    requiredForLaunch: true,
    validate: (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 100
        ? { ok: true, note: `VAT ${n}%` }
        : { ok: false, note: "Must be 0–100" };
    },
  },
  {
    key: "ORDINA_BILLING_ADDRESS",
    aliases: [],
    requiredForLaunch: false,
    validate: (v) => (v.length >= 5 ? { ok: true } : { ok: false, note: "Address recommended" }),
  },
  {
    key: "ORDINA_BILLING_ORG_NUMBER",
    aliases: [],
    requiredForLaunch: false,
    validate: (v) => (v.length >= 6 ? { ok: true } : { ok: false, note: "Org number recommended" }),
  },
  {
    key: "CONTACT_TO_EMAIL",
    aliases: [],
    requiredForLaunch: false,
    validate: (v) =>
      isEmail(v) ? { ok: true } : { ok: false, note: "Contact inbox recommended" },
  },
  {
    key: "ALERT_WEBHOOK_URL",
    aliases: [],
    requiredForLaunch: false,
    validate: (v) => {
      try {
        new URL(v);
        return { ok: true, note: "Alert webhook URL OK" };
      } catch {
        return { ok: false, note: "Invalid webhook URL" };
      }
    },
  },
];

export function evaluateLaunchEnv(): EnvCheckItem[] {
  normalizeAuthEnv();

  return LAUNCH_ENV_SPECS.map((spec) => {
    const allKeys = [spec.key, ...spec.aliases];
    const value = readEnv(allKeys);
    const present = Boolean(value);

    if (!present) {
      return {
        key: spec.key,
        aliases: spec.aliases,
        present: false,
        status: "missing" as const,
        validated: false,
        validationNote: "Not set",
        requiredForLaunch: spec.requiredForLaunch,
      };
    }

    const result = spec.validate(value);
    if (!result.ok) {
      return {
        key: spec.key,
        aliases: spec.aliases,
        present: true,
        status: "invalid" as const,
        validated: false,
        validationNote: result.note,
        requiredForLaunch: spec.requiredForLaunch,
      };
    }

    if (spec.key === "AUTH_SECRET" && /change-me/i.test(value)) {
      return {
        key: spec.key,
        aliases: spec.aliases,
        present: true,
        status: "weak" as const,
        validated: false,
        validationNote: "Placeholder secret",
        requiredForLaunch: spec.requiredForLaunch,
      };
    }

    return {
      key: spec.key,
      aliases: spec.aliases,
      present: true,
      status: "validated" as const,
      validated: true,
      validationNote: result.note,
      requiredForLaunch: spec.requiredForLaunch,
    };
  });
}
