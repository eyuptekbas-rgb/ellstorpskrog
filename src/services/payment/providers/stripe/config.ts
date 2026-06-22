import "server-only";

import { prisma } from "@/lib/prisma";
import { buildStripeConfig } from "@/lib/stripe/config";
import { ensureSiteSettings } from "@/lib/settings";
import { getPaymentEnvironment } from "@/src/services/payment/server/environment";

export type StripeProviderConfig = {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string | null;
  isLive: boolean;
};

export async function resolveStripeProviderConfig(
  businessId: string
): Promise<StripeProviderConfig | null> {
  const paymentSettings = await prisma.businessPaymentSettings.findUnique({
    where: { businessId },
  });

  if (paymentSettings?.stripeSecretKey?.trim()) {
    const env = getPaymentEnvironment();
    const siteSettings = await ensureSiteSettings(businessId);
    const siteConfig = buildStripeConfig(siteSettings);

    return {
      secretKey: paymentSettings.stripeSecretKey.trim(),
      publishableKey: paymentSettings.stripePublishableKey?.trim() ?? "",
      webhookSecret:
        env.stripeWebhookSecret?.trim() ?? siteConfig.webhookSecret,
      isLive: paymentSettings.isLive,
    };
  }

  const siteSettings = await ensureSiteSettings(businessId);
  const siteConfig = buildStripeConfig(siteSettings);

  if (siteConfig.secretKey) {
    return {
      secretKey: siteConfig.secretKey,
      publishableKey: siteConfig.publishableKey ?? "",
      webhookSecret: siteConfig.webhookSecret,
      isLive: !siteConfig.testMode,
    };
  }

  const env = getPaymentEnvironment();

  if (!env.stripeSecretKey?.trim()) {
    return null;
  }

  return {
    secretKey: env.stripeSecretKey.trim(),
    publishableKey: env.stripePublishableKey?.trim() ?? "",
    webhookSecret: env.stripeWebhookSecret?.trim() ?? null,
    isLive: false,
  };
}

export async function collectStripeWebhookSecrets(
  businessId?: string
): Promise<string[]> {
  const secrets = new Set<string>();

  const env = getPaymentEnvironment();

  if (env.stripeWebhookSecret?.trim()) {
    secrets.add(env.stripeWebhookSecret.trim());
  }

  if (process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    secrets.add(process.env.STRIPE_WEBHOOK_SECRET.trim());
  }

  if (businessId) {
    const config = await resolveStripeProviderConfig(businessId);
    if (config?.webhookSecret) {
      secrets.add(config.webhookSecret);
    }

    const siteSettings = await ensureSiteSettings(businessId);
    for (const secret of [
      siteSettings.stripeWebhookSecretTest,
      siteSettings.stripeWebhookSecretLive,
    ]) {
      if (secret?.trim()) secrets.add(secret.trim());
    }
  } else {
    const { collectAllStripeWebhookSecrets } = await import("@/lib/stripe/config");
    for (const secret of await collectAllStripeWebhookSecrets()) {
      secrets.add(secret);
    }
  }

  return [...secrets];
}
