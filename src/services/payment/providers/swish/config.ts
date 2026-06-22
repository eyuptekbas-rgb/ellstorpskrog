import "server-only";

import { readFileSync } from "node:fs";
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
    paymentSettings?.swishMerchantNumber?.trim() ??
    env.swishMerchantNumber?.trim() ??
    null;

  if (!merchantNumber) {
    return null;
  }

  let tls: ReturnType<typeof readSwishTlsMaterial>;

  try {
    tls = readSwishTlsMaterial();
  } catch {
    return null;
  }

  const isLive = paymentSettings?.isLive ?? false;
  const apiBaseUrl =
    process.env.SWISH_API_BASE_URL?.trim() ??
    (isLive ? SWISH_API_BASE_URLS.live : SWISH_API_BASE_URLS.test);

  return {
    merchantNumber,
    apiBaseUrl,
    cert: tls.cert,
    key: tls.key,
    ca: tls.ca,
    isLive,
  };
}

export function isSwishConfigured(config: SwishProviderConfig | null): boolean {
  return Boolean(config?.merchantNumber && config.cert && config.key);
}
