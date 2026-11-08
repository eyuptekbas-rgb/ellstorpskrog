import "server-only";

import { readFileSync } from "node:fs";
import { createSecureContext } from "node:tls";
import { prisma } from "@/lib/prisma";
import { SWISH_API_BASE_URLS } from "@/src/services/payment/providers/swish/constants";
import { getPaymentEnvironment } from "@/src/services/payment/server/environment";

export { SWISH_API_BASE_URLS } from "@/src/services/payment/providers/swish/constants";

export type SwishProviderConfig = {
  merchantNumber: string;
  apiBaseUrl: string;
  cert: Buffer;
  key: Buffer;
  ca?: Buffer;
  isLive: boolean;
  passphrase?: string;
};

function readOptionalFile(path: string | undefined): Buffer | undefined {
  const trimmed = path?.trim();
  if (!trimmed) return undefined;
  return readFileSync(trimmed);
}

function readRequiredCredential(
  pemEnv: string | undefined,
  pathEnv: string | undefined,
  label: string
): Buffer {
  const inline = pemEnv?.trim();
  if (inline) {
    return Buffer.from(inline.replace(/\\n/g, "\n"), "utf8");
  }

  const path = pathEnv?.trim();
  if (path) {
    return readFileSync(path);
  }

  throw new Error(`${label} is not configured for Swish Handel`);
}

export function readSwishTlsMaterial() {
  return {
    cert: readRequiredCredential(
      process.env.SWISH_CERT_PEM,
      process.env.SWISH_CERT_PATH,
      "Swish client certificate"
    ),
    key: readRequiredCredential(
      process.env.SWISH_KEY_PEM,
      process.env.SWISH_KEY_PATH,
      "Swish private key"
    ),
    passphrase: process.env.SWISH_KEY_PASSPHRASE,
    ca:
      readOptionalFile(process.env.SWISH_CA_PATH) ??
      (process.env.SWISH_CA_PEM?.trim()
        ? Buffer.from(process.env.SWISH_CA_PEM.replace(/\\n/g, "\n"), "utf8")
        : undefined),
  };
}

export async function resolveSwishProviderConfig(
  businessId: string
): Promise<SwishProviderConfig | null> {
  const paymentSettings = await prisma.businessPaymentSettings.findUnique({
    where: { businessId },
  });

  const env = getPaymentEnvironment();
  const merchantNumber =
    paymentSettings?.swishMerchantNumber?.trim() ||
    env.swishMerchantNumber?.trim() ||
    null;

  if (!paymentSettings?.swishEnabled) {
    return null;
  }
  if (!merchantNumber || !/^123\d{7}$/.test(merchantNumber)) {
    throw new Error("Swish merchant alias is missing or invalid for this tenant");
  }

  let tls: ReturnType<typeof readSwishTlsMaterial>;

  try {
    tls = readSwishTlsMaterial();
    createSecureContext({ ...tls, minVersion: "TLSv1.2" });
    console.info("[Swish] mTLS material loaded", {
      certificateLoaded: tls.cert.length > 0,
      privateKeyLoaded: tls.key.length > 0,
    });
  } catch (error) {
    throw new Error(
      `Swish mTLS credentials are invalid: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const isLive = paymentSettings?.isLive ?? false;
  const apiBaseUrl =
    process.env.SWISH_API_BASE_URL?.trim() ||
    (isLive ? SWISH_API_BASE_URLS.live : SWISH_API_BASE_URLS.test);
  // Never send merchant TLS material to an arbitrary override host.
  if (apiBaseUrl !== (isLive ? SWISH_API_BASE_URLS.live : SWISH_API_BASE_URLS.test)) {
    throw new Error("SWISH_API_BASE_URL does not match the tenant Swish environment");
  }
  if ((process.env.SWISH_CALLBACK_SECRET?.trim().length ?? 0) < 32) {
    throw new Error("SWISH_CALLBACK_SECRET must contain at least 32 characters");
  }
  getSwishAppUrl();

  return {
    merchantNumber,
    apiBaseUrl,
    cert: tls.cert,
    key: tls.key,
    ca: tls.ca,
    isLive,
    passphrase: tls.passphrase,
  };
}

export function getSwishAppUrl(): string {
  const url = new URL(process.env.SWISH_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "");
  if (url.protocol !== "https:" || url.username || url.password ||
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Swish requires a public HTTPS application URL");
  }
  return url.origin;
}

export function isSwishConfigured(config: SwishProviderConfig | null): boolean {
  return Boolean(config?.merchantNumber && config.cert && config.key);
}
