import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ServiceStatus } from "@/lib/health/checks";
import { isEmailConfigured } from "@/lib/email/resend";
import { MAX_RETRIES } from "@/lib/email/notifications/retry";
import type { NotificationType } from "@prisma/client";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/email/notifications/registry";
import {
  buildStripeConfig,
  collectStripeWebhookSecrets,
  getAppBaseUrl,
} from "@/lib/stripe/config";
import { ensureSiteSettings } from "@/lib/settings";
import type { EnvVarStatus } from "./status";

export type SetupCheckItem = {
  id: string;
  label: string;
  status: ServiceStatus;
  message?: string;
  category: "stripe" | "email" | "env" | "auth" | "database" | "launch";
};

const EMAIL_TEMPLATE_FILES: Record<NotificationType, string> = {
  CUSTOMER_ORDER_CONFIRMATION: "emails/OrderReceived.tsx",
  CUSTOMER_PAYMENT_CONFIRMATION: "emails/PaymentReceived.tsx",
  CUSTOMER_ORDER_READY: "emails/OrderReady.tsx",
  CUSTOMER_ORDER_DELIVERED: "emails/OrderCompleted.tsx",
  CUSTOMER_ORDER_CANCELLED: "emails/OrderCancelled.tsx",
  RESTAURANT_NEW_ORDER: "emails/RestaurantNewOrder.tsx",
  RESTAURANT_PAYMENT_RECEIVED: "emails/RestaurantPaymentReceived.tsx",
  RESTAURANT_ORDER_CANCELLED: "emails/RestaurantOrderCancelled.tsx",
};

function fileExists(relativePath: string): boolean {
  return existsSync(resolve(process.cwd(), relativePath));
}

export function percentFromChecks(items: SetupCheckItem[]): number {
  if (items.length === 0) return 0;
  const score = items.reduce((sum, item) => {
    if (item.status === "ok") return sum + 1;
    if (item.status === "warning") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((score / items.length) * 100);
}

export async function buildSetupChecklist(
  environment: EnvVarStatus[]
): Promise<{
  all: SetupCheckItem[];
  stripe: SetupCheckItem[];
  email: SetupCheckItem[];
  launch: SetupCheckItem[];
  stripeReadinessPercent: number;
  emailReadinessPercent: number;
}> {
  const settings = await ensureSiteSettings();
  const stripeActive = buildStripeConfig(settings);
  const stripeTest = buildStripeConfig({ ...settings, stripeTestMode: true });
  const stripeLive = buildStripeConfig({ ...settings, stripeTestMode: false });
  const webhookSecrets = collectStripeWebhookSecrets(settings);
  const baseUrl = getAppBaseUrl();
  const isProduction = process.env.NODE_ENV === "production";

  const stripe: SetupCheckItem[] = [
    {
      id: "stripe-secret",
      label: "API secret key (aktivt läge)",
      status: stripeActive.secretKey ? "ok" : "error",
      message: stripeActive.secretKey
        ? `${stripeActive.testMode ? "Test" : "Live"}-nyckel konfigurerad`
        : "Sätt i /admin/payments eller STRIPE_*_SECRET_KEY",
      category: "stripe",
    },
    {
      id: "stripe-publishable",
      label: "Publishable key (aktivt läge)",
      status: stripeActive.publishableKey ? "ok" : "error",
      message: stripeActive.publishableKey ? "Konfigurerad" : "Saknas",
      category: "stripe",
    },
    {
      id: "stripe-webhook-secret",
      label: "Webhook signing secret",
      status: stripeActive.webhookSecret ? "ok" : "error",
      message: stripeActive.webhookSecret
        ? "Konfigurerad för aktivt läge"
        : "Saknas — webhooks kommer misslyckas",
      category: "stripe",
    },
    {
      id: "stripe-enabled",
      label: "Kortbetalning aktiverad",
      status: stripeActive.enabled ? "ok" : stripeActive.configured ? "warning" : "error",
      message: stripeActive.enabled
        ? "Aktiverad i admin"
        : "Aktivera under /admin/payments",
      category: "stripe",
    },
    {
      id: "stripe-mode",
      label: "Test/live-läge",
      status:
        isProduction && stripeActive.testMode
          ? "error"
          : stripeActive.testMode
            ? "warning"
            : "ok",
      message: stripeActive.testMode
        ? isProduction
          ? "Testläge i produktion — byt till live före lansering"
          : "Testläge (OK för utveckling)"
        : "Live-läge",
      category: "stripe",
    },
    {
      id: "stripe-test-keys",
      label: "Test-nycklar",
      status: stripeTest.configured ? "ok" : "warning",
      message: stripeTest.configured
        ? "Test secret + publishable"
        : "Valfritt — konfigurera för sandbox",
      category: "stripe",
    },
    {
      id: "stripe-live-keys",
      label: "Live-nycklar",
      status: stripeLive.configured ? "ok" : isProduction ? "error" : "warning",
      message: stripeLive.configured
        ? "Live secret + publishable"
        : "Krävs för produktion",
      category: "stripe",
    },
    {
      id: "stripe-webhook-endpoint",
      label: "Webhook-URL i Stripe Dashboard",
      status: webhookSecrets.length > 0 ? "warning" : "error",
      message: `${baseUrl}/api/webhooks/stripe — verifiera manuellt i Stripe`,
      category: "stripe",
    },
    {
      id: "stripe-checkout-api",
      label: "Checkout session API",
      status: "ok",
      message: "POST /api/checkout/create-session",
      category: "stripe",
    },
    {
      id: "stripe-webhook-handler",
      label: "Webhook-händelser",
      status: "ok",
      message:
        "checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed",
      category: "stripe",
    },
    {
      id: "stripe-payment-status",
      label: "Order paymentStatus-uppdatering",
      status: "ok",
      message: "markOrderPaid / markOrderPaymentFailed via webhook",
      category: "stripe",
    },
  ];

  const missingTemplates = Object.entries(EMAIL_TEMPLATE_FILES).filter(
    ([, path]) => !fileExists(path)
  );

  const restaurantEmail =
    settings.notificationEmail?.trim() || settings.email?.trim();

  const email: SetupCheckItem[] = [
    {
      id: "email-api-key",
      label: "RESEND_API_KEY",
      status: isEmailConfigured() ? "ok" : "error",
      message: isEmailConfigured() ? "Konfigurerad" : "Saknas — e-post inaktiverad",
      category: "email",
    },
    {
      id: "email-from",
      label: "Avsändaradress",
      status: process.env.RESEND_FROM_EMAIL?.trim()
        ? "ok"
        : settings.emailSenderAddress?.trim()
          ? "ok"
          : "warning",
      message:
        settings.emailSenderAddress?.trim() ||
        process.env.RESEND_FROM_EMAIL ||
        "Sätt RESEND_FROM_EMAIL eller admin-avsändare",
      category: "email",
    },
    {
      id: "email-contact",
      label: "CONTACT_TO_EMAIL",
      status: process.env.CONTACT_TO_EMAIL?.trim() ? "ok" : "warning",
      message: process.env.CONTACT_TO_EMAIL?.trim() || "Kontaktformulär kan misslyckas",
      category: "email",
    },
    {
      id: "email-restaurant-inbox",
      label: "Restaurangnotifieringar",
      status: restaurantEmail ? "ok" : "error",
      message: restaurantEmail || "Sätt notificationEmail i /admin/settings",
      category: "email",
    },
    {
      id: "email-templates",
      label: "E-postmallar (8 st)",
      status: missingTemplates.length === 0 ? "ok" : "error",
      message:
        missingTemplates.length === 0
          ? "Alla React Email-mallar finns"
          : `Saknas: ${missingTemplates.map(([t]) => NOTIFICATION_TYPE_LABELS[t as NotificationType]).join(", ")}`,
      category: "email",
    },
    {
      id: "email-order-confirmation",
      label: "Orderbekräftelse (kund)",
      status: fileExists(EMAIL_TEMPLATE_FILES.CUSTOMER_ORDER_CONFIRMATION)
        ? "ok"
        : "error",
      message: "CUSTOMER_ORDER_CONFIRMATION → OrderReceived.tsx",
      category: "email",
    },
    {
      id: "email-restaurant-order",
      label: "Ny order (restaurang)",
      status: fileExists(EMAIL_TEMPLATE_FILES.RESTAURANT_NEW_ORDER)
        ? "ok"
        : "error",
      message: "RESTAURANT_NEW_ORDER → RestaurantNewOrder.tsx",
      category: "email",
    },
    {
      id: "email-retry-api",
      label: "Retry vid misslyckat utskick",
      status: "ok",
      message: `POST /api/notifications/retry — max ${MAX_RETRIES} försök per logg`,
      category: "email",
    },
    {
      id: "email-customer-toggle",
      label: "Kundmail aktiverat",
      status: settings.customerEmailsEnabled ? "ok" : "warning",
      message: settings.customerEmailsEnabled
        ? "Aktiverat"
        : "Inaktiverat i /admin/notifications",
      category: "email",
    },
    {
      id: "email-restaurant-toggle",
      label: "Restaurangmail aktiverat",
      status: settings.restaurantEmailsEnabled ? "ok" : "warning",
      message: settings.restaurantEmailsEnabled
        ? "Aktiverat"
        : "Inaktiverat i /admin/notifications",
      category: "email",
    },
  ];

  const launch: SetupCheckItem[] = [
    {
      id: "launch-env",
      label: "Obligatoriska miljövariabler",
      status: environment.some((e) => e.required && e.status !== "set")
        ? "error"
        : "ok",
      message: "DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL",
      category: "launch",
    },
    {
      id: "launch-url",
      label: "Produktions-URL (HTTPS)",
      status:
        baseUrl.startsWith("https://") && !baseUrl.includes("localhost")
          ? "ok"
          : "warning",
      message: baseUrl,
      category: "launch",
    },
    {
      id: "launch-stripe-live",
      label: "Stripe live-läge",
      status:
        isProduction && stripeActive.testMode
          ? "error"
          : stripeLive.configured && !stripeActive.testMode
            ? "ok"
            : "warning",
      message: "Byt testläge + live-nycklar i /admin/payments",
      category: "launch",
    },
    {
      id: "launch-resend-dns",
      label: "Resend domänverifiering",
      status: "warning",
      message: "Verifiera DNS (SPF/DKIM) i Resend Dashboard",
      category: "launch",
    },
    {
      id: "launch-webhook",
      label: "Stripe webhook i produktion",
      status: stripeLive.webhookSecret ? "warning" : "error",
      message: `Skapa endpoint → ${baseUrl}/api/webhooks/stripe`,
      category: "launch",
    },
    {
      id: "launch-test-payment",
      label: "Testbetalning verifierad",
      status: "warning",
      message: "Genomför manuellt efter deploy",
      category: "launch",
    },
    {
      id: "launch-test-email",
      label: "Testmail skickat",
      status: "warning",
      message: "/admin/notifications/test",
      category: "launch",
    },
    {
      id: "launch-admin-password",
      label: "Admin-lösenord bytt",
      status: "warning",
      message: "Byt från default efter ensure-admin.ts",
      category: "launch",
    },
  ];

  const all = [...stripe, ...email, ...launch];

  return {
    all,
    stripe,
    email,
    launch,
    stripeReadinessPercent: percentFromChecks(stripe),
    emailReadinessPercent: percentFromChecks(email),
  };
}

export function getMissingEnvVars(environment: EnvVarStatus[]): string[] {
  return environment
    .filter((e) => e.status === "missing" || e.status === "weak")
    .map((e) => e.key);
}
