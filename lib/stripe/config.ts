import type { SiteSettings } from "@prisma/client";
import { getSiteUrl } from "@/lib/seo/url";
import { ensureSiteSettings } from "@/lib/settings";

export type StripeConfig = {
  enabled: boolean;
  configured: boolean;
  testMode: boolean;
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
};

function pickKey(
  settingsValue: string | null | undefined,
  envValue: string | undefined
): string | null {
  const value = settingsValue?.trim() || envValue?.trim();
  return value || null;
}

export function buildStripeConfig(settings: SiteSettings): StripeConfig {
  const testMode = settings.stripeTestMode;

  const testSecretEnv =
    process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;
  const liveSecretEnv =
    process.env.STRIPE_LIVE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;

  const testPublishableEnv =
    process.env.STRIPE_TEST_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY;
  const livePublishableEnv =
    process.env.STRIPE_LIVE_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY;

  const testWebhookEnv =
    process.env.STRIPE_TEST_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
  const liveWebhookEnv =
    process.env.STRIPE_LIVE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;

  const secretKey = testMode
    ? pickKey(settings.stripeSecretKeyTest, testSecretEnv)
    : pickKey(settings.stripeSecretKeyLive, liveSecretEnv);

  const publishableKey = testMode
    ? pickKey(settings.stripePublishableKeyTest, testPublishableEnv)
    : pickKey(settings.stripePublishableKeyLive, livePublishableEnv);

  const webhookSecret = testMode
    ? pickKey(settings.stripeWebhookSecretTest, testWebhookEnv)
    : pickKey(settings.stripeWebhookSecretLive, liveWebhookEnv);

  const configured = Boolean(secretKey && publishableKey);

  return {
    enabled: settings.stripeEnabled && configured,
    configured,
    testMode,
    secretKey,
    publishableKey,
    webhookSecret,
  };
}

/** All webhook signing secrets (test + live) for signature verification */
export function collectStripeWebhookSecrets(
  settings: SiteSettings
): string[] {
  const testConfig = buildStripeConfig({
    ...settings,
    stripeTestMode: true,
  });
  const liveConfig = buildStripeConfig({
    ...settings,
    stripeTestMode: false,
  });

  const secrets = [
    testConfig.webhookSecret,
    liveConfig.webhookSecret,
    process.env.STRIPE_TEST_WEBHOOK_SECRET,
    process.env.STRIPE_LIVE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].filter((s): s is string => Boolean(s?.trim()));

  return [...new Set(secrets)];
}

export async function getStripeConfig(): Promise<StripeConfig> {
  const settings = await ensureSiteSettings();
  return buildStripeConfig(settings);
}

export function getAppBaseUrl(): string {
  return getSiteUrl();
}
