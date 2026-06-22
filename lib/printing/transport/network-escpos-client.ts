import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import { isPosEmergencyDebug, posDebugLog, debugPrintSuccess } from "@/lib/debug/pos-emergency-debug";
import { uint8ToBase64 } from "@/lib/printing/transport/escpos-bytes";
import type { PrintResult } from "@/lib/printing/types";

export type NetworkEscPosJobRequest = {
  host: string;
  port: number;
  base64: string;
  drawerOnly?: boolean;
  skipStatusCheck?: boolean;
};

export async function postNetworkEscPosJob(
  host: string,
  port: number,
  bytes: Uint8Array,
  meta?: { drawerOnly?: boolean; skipStatusCheck?: boolean }
): Promise<PrintResult> {
  if (isPosEmergencyDebug()) {
    posDebugLog("NETWORK ESC/POS BYPASS", { host, port });
    return debugPrintSuccess("network");
  }

  const body: NetworkEscPosJobRequest = {
    host,
    port,
    base64: uint8ToBase64(bytes),
    drawerOnly: meta?.drawerOnly,
    skipStatusCheck: meta?.skipStatusCheck ?? true,
  };

  try {
    const res = await fetchWithTimeout(
      "/api/admin/print/escpos",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      12_000
    );

    const payload = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      bytesSent?: number;
    };

    if (!res.ok || !payload.success) {
      return {
        success: false,
        providerId: "network",
        errorMessage: payload.error ?? `Network print failed (${res.status}).`,
      };
    }

    return {
      success: true,
      providerId: "network",
    };
  } catch (err) {
    return {
      success: false,
      providerId: "network",
      errorMessage:
        err instanceof Error ? err.message : "Network ESC/POS request failed.",
    };
  }
}
