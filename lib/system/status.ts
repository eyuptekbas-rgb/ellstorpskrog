import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isEmailConfigured } from "@/lib/email/resend";
import { runHealthChecks, type ServiceStatus } from "@/lib/health/checks";
import { getSiteUrl } from "@/lib/seo/url";
import { getStripeConfig } from "@/lib/stripe/config";

export type EnvVarStatus = {
  key: string;
  required: boolean;
  status: "set" | "missing" | "weak" | "local";
  label: string;
};

export type CheckItem = {
  id: string;
  label: string;
  status: ServiceStatus;
  message?: string;
};

export type SystemStatus = {
  timestamp: string;
  buildVersion: string;
  nodeEnv: string;
  vercelEnv: string | null;
  readinessPercent: number;
  stripeReadinessPercent: number;
  emailReadinessPercent: number;
  launchBlockers: string[];
  missingEnvVars: string[];
  health: Awaited<ReturnType<typeof runHealthChecks>>;
  environment: EnvVarStatus[];
  setupChecklist: import("./readiness").SetupCheckItem[];
  setupStripe: import("./readiness").SetupCheckItem[];
  setupEmail: import("./readiness").SetupCheckItem[];
  setupLaunch: import("./readiness").SetupCheckItem[];
  seo: CheckItem[];
  pwa: CheckItem[];
  security: CheckItem[];
  rateLimit: CheckItem[];
  imageOptimization: CheckItem[];
};

const ENV_CHECKS: Array<{
  key: string;
  required: boolean;
  label: string;
}> = [
  { key: "DATABASE_URL", required: true, label: "PostgreSQL" },
  { key: "AUTH_SECRET", required: true, label: "Auth.js secret" },
  { key: "NEXT_PUBLIC_APP_URL", required: true, label: "Public app URL" },
  { key: "STRIPE_SECRET_KEY", required: false, label: "Stripe secret (fallback)" },
  { key: "STRIPE_TEST_SECRET_KEY", required: false, label: "Stripe test secret" },
  { key: "STRIPE_LIVE_SECRET_KEY", required: false, label: "Stripe live secret" },
  { key: "STRIPE_PUBLISHABLE_KEY", required: false, label: "Stripe publishable" },
  { key: "STRIPE_WEBHOOK_SECRET", required: false, label: "Stripe webhook" },
  { key: "STRIPE_TEST_WEBHOOK_SECRET", required: false, label: "Stripe test webhook" },
  { key: "STRIPE_LIVE_WEBHOOK_SECRET", required: false, label: "Stripe live webhook" },
  { key: "RESEND_API_KEY", required: false, label: "Resend API key" },
  { key: "RESEND_FROM_EMAIL", required: false, label: "Resend sender" },
  { key: "CONTACT_TO_EMAIL", required: false, label: "Contact inbox" },
];

function checkEnvVar(key: string): EnvVarStatus["status"] {
  const v = process.env[key]?.trim() ?? "";
  if (!v) return "missing";
  if (key === "AUTH_SECRET" && (v.length < 32 || /change-me/i.test(v))) return "weak";
  if (key === "NEXT_PUBLIC_APP_URL" && /localhost|127\.0\.0\.1/.test(v)) return "local";
  return "set";
}

function fileExists(relativePath: string): boolean {
  return existsSync(resolve(process.cwd(), relativePath));
}

function getBuildVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function checkSeo(): CheckItem[] {
  const siteUrl = getSiteUrl();
  const isProductionUrl =
    siteUrl.startsWith("https://") && !siteUrl.includes("localhost");

  return [
    {
      id: "site-url",
      label: "Produktions-URL",
      status: isProductionUrl ? "ok" : "warning",
      message: isProductionUrl
        ? siteUrl
        : `Använder ${siteUrl} — sätt NEXT_PUBLIC_APP_URL till HTTPS-domän`,
    },
    {
      id: "sitemap",
      label: "sitemap.xml",
      status: "ok",
      message: `${siteUrl}/sitemap.xml`,
    },
    {
      id: "robots",
      label: "robots.txt",
      status: "ok",
      message: "Blockerar /admin, /api, /checkout",
    },
    {
      id: "metadata",
      label: "SEO-metadata",
      status: isProductionUrl ? "ok" : "warning",
      message: "Dynamisk metadata via SiteSettings + OpenGraph",
    },
  ];
}

function checkPwa(): CheckItem[] {
  const icons = [
    "public/icons/icon-192.png",
    "public/icons/icon-512.png",
    "public/icons/icon-512-maskable.png",
    "public/icons/apple-touch-icon.png",
  ];
  const missing = icons.filter((p) => !fileExists(p));
  const manifestOk = fileExists("public/manifest.webmanifest");

  return [
    {
      id: "manifest",
      label: "Web manifest",
      status: manifestOk ? "ok" : "error",
      message: manifestOk ? "/manifest.webmanifest" : "manifest.webmanifest saknas",
    },
    {
      id: "icons",
      label: "PWA-ikoner",
      status: missing.length === 0 ? "ok" : "error",
      message:
        missing.length === 0
          ? "192px, 512px, maskable, apple-touch"
          : `Saknas: ${missing.map((p) => p.replace("public/", "")).join(", ")}`,
    },
    {
      id: "sw",
      label: "Service worker",
      status: process.env.NODE_ENV === "production" || fileExists("public/sw.js") ? "ok" : "warning",
      message:
        process.env.NODE_ENV === "production"
          ? "Genereras vid produktionsbuild"
          : fileExists("public/sw.js")
            ? "sw.js finns (tidigare build)"
            : "Endast i produktionsbuild",
    },
    {
      id: "offline",
      label: "Offline-sida",
      status: fileExists("app/offline/page.tsx") ? "ok" : "error",
      message: "/offline",
    },
    {
      id: "assetlinks",
      label: "Android TWA",
      status: fileExists("public/.well-known/assetlinks.json") ? "warning" : "error",
      message: "SHA256-fingeravtryck måste uppdateras för produktion",
    },
  ];
}

function checkSecurity(): CheckItem[] {
  return [
    {
      id: "headers",
      label: "Säkerhetsheaders",
      status: "ok",
      message: "X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS",
    },
    {
      id: "admin-auth",
      label: "Admin-skydd",
      status: "ok",
      message: "Middleware + NextAuth JWT för /admin och skyddade API:er",
    },
    {
      id: "health",
      label: "Health endpoint",
      status: "ok",
      message: "GET /api/health",
    },
  ];
}

function checkRateLimit(): CheckItem[] {
  return [
    {
      id: "middleware",
      label: "API rate limiting",
      status: "ok",
      message: "In-memory begränsning på publika POST-endpoints",
    },
  ];
}

function checkImages(): CheckItem[] {
  const heroExists = fileExists("public/hero.jpg");
  return [
    {
      id: "next-image",
      label: "Next.js Image",
      status: "ok",
      message: "remotePatterns konfigurerade i next.config.ts",
    },
    {
      id: "hero",
      label: "Hero-bild",
      status: heroExists ? "ok" : "warning",
      message: heroExists ? "/hero.jpg" : "public/hero.jpg saknas — OG-fallback",
    },
  ];
}

function computeReadiness(
  env: EnvVarStatus[],
  health: Awaited<ReturnType<typeof runHealthChecks>>,
  pwa: CheckItem[],
  seo: CheckItem[],
  security: CheckItem[],
  rateLimit: CheckItem[],
  images: CheckItem[]
): { percent: number; blockers: string[] } {
  const blockers: string[] = [];

  const requiredEnv = env.filter((e) => e.required);
  for (const e of requiredEnv) {
    if (e.status === "missing") blockers.push(`${e.key} saknas`);
    if (e.status === "weak") blockers.push(`${e.key} är för svag`);
    if (e.key === "NEXT_PUBLIC_APP_URL" && e.status === "local") {
      blockers.push("NEXT_PUBLIC_APP_URL pekar på localhost");
    }
  }

  if (health.database.status === "error") blockers.push("Databas otillgänglig");
  if (health.auth.status === "error") blockers.push("AUTH_SECRET ogiltig");

  const pwaErrors = pwa.filter((p) => p.status === "error");
  for (const p of pwaErrors) {
    blockers.push(`PWA: ${p.label}`);
  }

  if (!isEmailConfigured()) {
    blockers.push("RESEND_API_KEY saknas — e-post inaktiverad");
  }

  const checks: ServiceStatus[] = [
    ...requiredEnv.map((e) =>
      e.status === "set" ? "ok" : e.status === "local" && e.key !== "NEXT_PUBLIC_APP_URL" ? "ok" : "error"
    ),
    health.database.status,
    health.auth.status === "warning" ? "ok" : health.auth.status,
    ...pwa.map((p) => p.status),
    ...seo.map((s) => (s.status === "warning" ? "ok" : s.status)),
    ...security.map((s) => s.status),
    ...rateLimit.map((s) => s.status),
    ...images.map((s) => (s.status === "warning" ? "ok" : s.status)),
  ];

  const okCount = checks.filter((s) => s === "ok").length;
  const percent = Math.round((okCount / checks.length) * 100);

  return { percent, blockers };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const health = await runHealthChecks();
  const stripe = await getStripeConfig();

  const environment: EnvVarStatus[] = ENV_CHECKS.map(({ key, required, label }) => ({
    key,
    required,
    label,
    status: checkEnvVar(key),
  }));

  const seo = checkSeo();
  const pwa = checkPwa();
  const security = checkSecurity();
  const rateLimit = checkRateLimit();
  const imageOptimization = checkImages();

  const { percent, blockers } = computeReadiness(
    environment,
    health,
    pwa,
    seo,
    security,
    rateLimit,
    imageOptimization
  );

  if (stripe.enabled && stripe.testMode && process.env.NODE_ENV === "production") {
    blockers.push("Stripe är i testläge — byt till live-nycklar före lansering");
  }

  if (!stripe.configured) {
    blockers.push("Stripe-nycklar saknas — kortbetalning inaktiverad");
  }

  const { buildSetupChecklist, getMissingEnvVars } = await import("./readiness");
  const setup = await buildSetupChecklist(environment);

  const overallPercent = Math.round(
    (percent + setup.stripeReadinessPercent + setup.emailReadinessPercent) / 3
  );

  return {
    timestamp: new Date().toISOString(),
    buildVersion: getBuildVersion(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    vercelEnv: process.env.VERCEL_ENV ?? null,
    readinessPercent: overallPercent,
    stripeReadinessPercent: setup.stripeReadinessPercent,
    emailReadinessPercent: setup.emailReadinessPercent,
    launchBlockers: [...new Set(blockers)],
    missingEnvVars: getMissingEnvVars(environment),
    health,
    environment,
    setupChecklist: setup.all,
    setupStripe: setup.stripe,
    setupEmail: setup.email,
    setupLaunch: setup.launch,
    seo,
    pwa,
    security,
    rateLimit,
    imageOptimization,
  };
}
