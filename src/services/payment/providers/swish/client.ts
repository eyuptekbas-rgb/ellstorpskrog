import "server-only";

import https from "node:https";
import type { SwishProviderConfig } from "@/src/services/payment/providers/swish/config";
import { SWISH_API_PATH, SWISH_CREATE_API_PATH } from "@/src/services/payment/providers/swish/constants";

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

function safeDiagnosticMessage(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.replace(/[\r\n]+/g, " ").slice(0, 256);
}

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
        path: `${method === "PUT" ? SWISH_CREATE_API_PATH : SWISH_API_PATH}${resourcePath}`,
        method,
        cert: config.cert,
        key: config.key,
        ca: config.ca,
        passphrase: config.passphrase,
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
        headers: {
          ...(payload
            ? {
                "Content-Type": method === "PATCH" ? "application/json-patch+json" : "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      async (response) => {
        try {
        const rawBody = await collectResponseBody(response);
        const locationHeader = response.headers.location;
        const location =
          typeof locationHeader === "string" ? locationHeader : locationHeader?.[0];

        const parsedBody = parseJsonBody(rawBody) as T | null;
        if ((response.statusCode ?? 0) < 200 || (response.statusCode ?? 0) >= 300) {
          const errorMessage =
            parsedBody && typeof parsedBody === "object" && "errorMessage" in parsedBody
              ? safeDiagnosticMessage((parsedBody as { errorMessage?: unknown }).errorMessage)
              : undefined;
          console.warn("[Swish] non-2xx response", {
            statusCode: response.statusCode ?? 0,
            ...(errorMessage ? { errorMessage } : {}),
          });
        }

        resolve({
          statusCode: response.statusCode ?? 0,
          headers: response.headers as Record<string, string | string[] | undefined>,
          body: parsedBody,
          rawBody,
          location,
        });
        } catch (error) {
          reject(error);
        }
      }
    );

    request.on("error", (error) => {
      console.error("[Swish] API request error", {
        message: safeDiagnosticMessage(error instanceof Error ? error.message : String(error)) ?? "Unknown request error",
      });
      reject(error);
    });
    request.setTimeout(15000, () => request.destroy(new Error("Swish request timed out")));

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
