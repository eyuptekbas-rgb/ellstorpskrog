import "server-only";

import https from "node:https";
import type { SwishProviderConfig } from "@/src/services/payment/providers/swish/config";
import { SWISH_API_PATH } from "@/src/services/payment/providers/swish/constants";

export type SwishApiError = {
  errorCode: string;
  errorMessage: string;
  additionalInformation?: string;
};

export type SwishApiResponse<T> = {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: T | null;
  rawBody: string;
  location?: string;
};

function parseJsonBody(rawBody: string): unknown {
  if (!rawBody.trim()) return null;

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

function collectResponseBody(
  response: import("node:http").IncomingMessage
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    response.on("data", (chunk: Buffer) => chunks.push(chunk));
    response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    response.on("error", reject);
  });
}

export async function swishApiRequest<T = unknown>(
  config: SwishProviderConfig,
  method: "GET" | "POST" | "PATCH" | "PUT",
  resourcePath: string,
  body?: unknown
): Promise<SwishApiResponse<T>> {
  const url = new URL(config.apiBaseUrl);
  const payload = body === undefined ? undefined : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${SWISH_API_PATH}${resourcePath}`,
        method,
        cert: config.cert,
        key: config.key,
        ca: config.ca,
        headers: {
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      async (response) => {
        const rawBody = await collectResponseBody(response);
        const locationHeader = response.headers.location;
        const location =
          typeof locationHeader === "string" ? locationHeader : locationHeader?.[0];

        resolve({
          statusCode: response.statusCode ?? 0,
          headers: response.headers as Record<string, string | string[] | undefined>,
          body: parseJsonBody(rawBody) as T | null,
          rawBody,
          location,
        });
      }
    );

    request.on("error", reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

export function formatSwishApiError(
  response: SwishApiResponse<SwishApiError | null>
): string {
  const error = response.body;
  if (error?.errorMessage) {
    return `${error.errorCode}: ${error.errorMessage}`;
  }

  return `Swish API request failed with status ${response.statusCode}`;
}
