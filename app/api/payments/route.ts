import { NextResponse } from "next/server";
import { buildStripeConfig } from "@/lib/stripe/config";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

function maskKey(key: string | null | undefined): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function paymentsResponse(
  settings: Awaited<ReturnType<typeof ensureSiteSettings>>
) {
  const config = buildStripeConfig(settings);
  return {
    stripeEnabled: settings.stripeEnabled,
    stripeTestMode: settings.stripeTestMode,
    stripePublishableKeyTest: settings.stripePublishableKeyTest ?? "",
    stripePublishableKeyLive: settings.stripePublishableKeyLive ?? "",
    configured: config.configured,
    activeMode: config.testMode ? "test" : "live",
    maskedPublishableKey: maskKey(config.publishableKey),
    maskedSecretKey: maskKey(config.secretKey),
    maskedWebhookSecretTest: maskKey(settings.stripeWebhookSecretTest),
    maskedWebhookSecretLive: maskKey(settings.stripeWebhookSecretLive),
    hasSecretKeyTest: Boolean(settings.stripeSecretKeyTest?.trim()),
    hasSecretKeyLive: Boolean(settings.stripeSecretKeyLive?.trim()),
    hasWebhookSecretTest: Boolean(settings.stripeWebhookSecretTest?.trim()),
    hasWebhookSecretLive: Boolean(settings.stripeWebhookSecretLive?.trim()),
    hasEnvSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    hasEnvPublishableKey: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
    hasEnvWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };
}

export async function GET() {
  try {
    const tenantId = await getAdminTenantId();
    const settings = await ensureSiteSettings(tenantId);
    return NextResponse.json(paymentsResponse(settings));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
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

function secretUpdate(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  if (!trimmed || trimmed.includes("…")) return undefined;
  return trimmed;
}

export async function PATCH(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    await ensureSiteSettings(tenantId);
    const body: UpdatePaymentsBody = await req.json();

    const settings = await prisma.siteSettings.update({
      where: { tenantId },
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
        ...(secretUpdate(body.stripeSecretKeyTest) !== undefined && {
          stripeSecretKeyTest: secretUpdate(body.stripeSecretKeyTest) ?? null,
        }),
        ...(secretUpdate(body.stripeWebhookSecretTest) !== undefined && {
          stripeWebhookSecretTest:
            secretUpdate(body.stripeWebhookSecretTest) ?? null,
        }),
        ...(body.stripePublishableKeyLive !== undefined && {
          stripePublishableKeyLive:
            body.stripePublishableKeyLive?.trim() || null,
        }),
        ...(secretUpdate(body.stripeSecretKeyLive) !== undefined && {
          stripeSecretKeyLive: secretUpdate(body.stripeSecretKeyLive) ?? null,
        }),
        ...(secretUpdate(body.stripeWebhookSecretLive) !== undefined && {
          stripeWebhookSecretLive:
            secretUpdate(body.stripeWebhookSecretLive) ?? null,
        }),
      },
    });

    return NextResponse.json(paymentsResponse(settings));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PATCH /api/payments error:", error);
    return NextResponse.json(
      { error: "Failed to update payment settings" },
      { status: 500 }
    );
  }
}
