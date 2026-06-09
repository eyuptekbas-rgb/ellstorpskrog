import { NextResponse } from "next/server";
import { buildStripeConfig } from "@/lib/stripe/config";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

function maskKey(key: string | null | undefined): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export async function GET() {
  try {
    const settings = await ensureSiteSettings();
    const config = buildStripeConfig(settings);

    return NextResponse.json({
      stripeEnabled: settings.stripeEnabled,
      stripeTestMode: settings.stripeTestMode,
      stripePublishableKeyTest: settings.stripePublishableKeyTest ?? "",
      stripeSecretKeyTest: settings.stripeSecretKeyTest ?? "",
      stripeWebhookSecretTest: settings.stripeWebhookSecretTest ?? "",
      stripePublishableKeyLive: settings.stripePublishableKeyLive ?? "",
      stripeSecretKeyLive: settings.stripeSecretKeyLive ?? "",
      stripeWebhookSecretLive: settings.stripeWebhookSecretLive ?? "",
      configured: config.configured,
      activeMode: config.testMode ? "test" : "live",
      maskedPublishableKey: maskKey(config.publishableKey),
      maskedSecretKey: maskKey(config.secretKey),
      hasEnvSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasEnvPublishableKey: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
      hasEnvWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment settings" },
      { status: 500 }
    );
  }
}

type UpdatePaymentsBody = {
  stripeEnabled?: boolean;
  stripeTestMode?: boolean;
  stripePublishableKeyTest?: string | null;
  stripeSecretKeyTest?: string | null;
  stripeWebhookSecretTest?: string | null;
  stripePublishableKeyLive?: string | null;
  stripeSecretKeyLive?: string | null;
  stripeWebhookSecretLive?: string | null;
};

export async function PATCH(req: Request) {
  try {
    await ensureSiteSettings();
    const body: UpdatePaymentsBody = await req.json();

    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        ...(body.stripeEnabled !== undefined && {
          stripeEnabled: body.stripeEnabled,
        }),
        ...(body.stripeTestMode !== undefined && {
          stripeTestMode: body.stripeTestMode,
        }),
        ...(body.stripePublishableKeyTest !== undefined && {
          stripePublishableKeyTest:
            body.stripePublishableKeyTest?.trim() || null,
        }),
        ...(body.stripeSecretKeyTest !== undefined && {
          stripeSecretKeyTest: body.stripeSecretKeyTest?.trim() || null,
        }),
        ...(body.stripeWebhookSecretTest !== undefined && {
          stripeWebhookSecretTest:
            body.stripeWebhookSecretTest?.trim() || null,
        }),
        ...(body.stripePublishableKeyLive !== undefined && {
          stripePublishableKeyLive:
            body.stripePublishableKeyLive?.trim() || null,
        }),
        ...(body.stripeSecretKeyLive !== undefined && {
          stripeSecretKeyLive: body.stripeSecretKeyLive?.trim() || null,
        }),
        ...(body.stripeWebhookSecretLive !== undefined && {
          stripeWebhookSecretLive:
            body.stripeWebhookSecretLive?.trim() || null,
        }),
      },
    });

    const config = buildStripeConfig(settings);

    return NextResponse.json({
      stripeEnabled: settings.stripeEnabled,
      stripeTestMode: settings.stripeTestMode,
      stripePublishableKeyTest: settings.stripePublishableKeyTest ?? "",
      stripeSecretKeyTest: settings.stripeSecretKeyTest ?? "",
      stripeWebhookSecretTest: settings.stripeWebhookSecretTest ?? "",
      stripePublishableKeyLive: settings.stripePublishableKeyLive ?? "",
      stripeSecretKeyLive: settings.stripeSecretKeyLive ?? "",
      stripeWebhookSecretLive: settings.stripeWebhookSecretLive ?? "",
      configured: config.configured,
      activeMode: config.testMode ? "test" : "live",
      maskedPublishableKey: maskKey(config.publishableKey),
      maskedSecretKey: maskKey(config.secretKey),
      hasEnvSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasEnvPublishableKey: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
      hasEnvWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  } catch (error) {
    console.error("PATCH /api/payments error:", error);
    return NextResponse.json(
      { error: "Failed to update payment settings" },
      { status: 500 }
    );
  }
}
