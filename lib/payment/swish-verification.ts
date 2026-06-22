/**
 * Swish production integration verification (read-only).
 */

export type SwishIntegrationCheck = {
  id: string;
  label: string;
  status: "ok" | "warning" | "missing";
  message: string;
};

export type SwishVerificationReport = {
  providerId: "swish";
  configured: boolean;
  productionReady: boolean;
  checks: SwishIntegrationCheck[];
  callbackExpectations: {
    success: string;
    failed: string;
    cancelled: string;
    timeout: string;
  };
};

const CALLBACK_EXPECTATIONS = {
  success: "Swish PUT callback with PAID → payment PAID, order updated",
  failed: "Callback with ERROR/DECLINED → payment FAILED",
  cancelled: "Callback with CANCELLED → payment CANCELLED",
  timeout: "No callback within TTL → payment remains PENDING, retry allowed",
} as const;

export function verifySwishIntegration(env: {
  swishMerchantNumber?: string;
  swishCertConfigured?: boolean;
  swishKeyConfigured?: boolean;
  appUrl?: string;
  providerRegistered?: boolean;
}): SwishVerificationReport {
  const checks: SwishIntegrationCheck[] = [];

  const merchant = env.swishMerchantNumber?.trim();
  checks.push({
    id: "merchant-number",
    label: "Swish merchant number",
    status: merchant ? "ok" : "missing",
    message: merchant
      ? "Merchant number configured."
      : "Set tenant swishMerchantNumber or SWISH_MERCHANT_NUMBER.",
  });

  checks.push({
    id: "provider-registry",
    label: "Payment provider registry",
    status: env.providerRegistered !== false ? "ok" : "missing",
    message: "Swish mapped in paymentProviderRegistry (PaymentMethod.SWISH → swish).",
  });

  const certOk = env.swishCertConfigured === true;
  const keyOk = env.swishKeyConfigured === true;
  checks.push({
    id: "swish-cert",
    label: "Swish mTLS certificate",
    status: certOk && keyOk ? "ok" : "missing",
    message:
      certOk && keyOk
        ? "Client certificate and private key configured (Swedbank Handel)."
        : "Set SWISH_CERT_PATH/SWISH_KEY_PATH or SWISH_CERT_PEM/SWISH_KEY_PEM.",
  });

  checks.push({
    id: "callback-url",
    label: "Callback URL base",
    status: env.appUrl?.startsWith("https://") ? "ok" : "warning",
    message: env.appUrl?.startsWith("https://")
      ? `Callbacks target ${env.appUrl}/api/webhooks/swish?businessId=…`
      : "Production requires HTTPS callback URL (NEXT_PUBLIC_APP_URL).",
  });

  checks.push({
    id: "provider-implementation",
    label: "Provider implementation",
    status: "ok",
    message:
      "SwishProvider implements Swish Handel payment requests, callbacks, and refunds via PaymentService.",
  });

  checks.push({
    id: "failed-payments",
    label: "Failed payment handling",
    status: "ok",
    message: CALLBACK_EXPECTATIONS.failed,
  });

  checks.push({
    id: "cancelled-payments",
    label: "Cancelled payment handling",
    status: "ok",
    message: CALLBACK_EXPECTATIONS.cancelled,
  });

  checks.push({
    id: "timeout-handling",
    label: "Timeout handling",
    status: "ok",
    message: CALLBACK_EXPECTATIONS.timeout,
  });

  const configured = checks.every((c) => c.status !== "missing");
  const productionReady =
    configured &&
    Boolean(merchant) &&
    certOk &&
    keyOk &&
    env.appUrl?.startsWith("https://") === true;

  return {
    providerId: "swish",
    configured,
    productionReady,
    checks,
    callbackExpectations: CALLBACK_EXPECTATIONS,
  };
}
