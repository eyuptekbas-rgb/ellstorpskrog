const PAYMENT_ENV_KEYS = {
  stripeSecretKey: "STRIPE_SECRET_KEY",
  stripePublishableKey: "STRIPE_PUBLISHABLE_KEY",
  stripeWebhookSecret: "STRIPE_WEBHOOK_SECRET",
  swishMerchantNumber: "SWISH_MERCHANT_NUMBER",
  swishCertPath: "SWISH_CERT_PATH",
  swishKeyPath: "SWISH_KEY_PATH",
  swishCertPem: "SWISH_CERT_PEM",
  swishKeyPem: "SWISH_KEY_PEM",
  swishCaPath: "SWISH_CA_PATH",
  swishApiBaseUrl: "SWISH_API_BASE_URL",
  mobilePayMerchantId: "MOBILEPAY_MERCHANT_ID",
} as const;

export function getPaymentEnvironment() {
  return {
    stripeSecretKey: process.env[PAYMENT_ENV_KEYS.stripeSecretKey],
    stripePublishableKey: process.env[PAYMENT_ENV_KEYS.stripePublishableKey],
    stripeWebhookSecret: process.env[PAYMENT_ENV_KEYS.stripeWebhookSecret],
    swishMerchantNumber: process.env[PAYMENT_ENV_KEYS.swishMerchantNumber],
    swishCertPath: process.env[PAYMENT_ENV_KEYS.swishCertPath],
    swishKeyPath: process.env[PAYMENT_ENV_KEYS.swishKeyPath],
    swishCertPem: process.env[PAYMENT_ENV_KEYS.swishCertPem],
    swishKeyPem: process.env[PAYMENT_ENV_KEYS.swishKeyPem],
    swishCaPath: process.env[PAYMENT_ENV_KEYS.swishCaPath],
    swishApiBaseUrl: process.env[PAYMENT_ENV_KEYS.swishApiBaseUrl],
    mobilePayMerchantId: process.env[PAYMENT_ENV_KEYS.mobilePayMerchantId],
  };
}

export { PAYMENT_ENV_KEYS };
