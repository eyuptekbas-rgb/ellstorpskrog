import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import {
  debugPrintSuccess,
  isPosEmergencyDebug,
  posDebugLog,
} from "@/lib/debug/pos-emergency-debug";
import { resolveWindowsAgentUrl } from "@/lib/printing/config/windows-printer-config";
import { uint8ToBase64 } from "@/lib/printing/transport/escpos-bytes";
import type { PrintDocumentType } from "@/lib/printing/types";
import type { PrintResult } from "@/lib/printing/types";

export type LocalPrintAgentStatus = {
  ok: boolean;
  version?: string;
  queue?: { pending: number; processing: boolean; lastError: string | null };
  printers?: {
    default: string | null;
    receipt: string | null;
    kitchen: string | null;
  };
};

const AGENT_TIMEOUT_MS = 12_000;

function agentBaseUrl(): string {
  return resolveWindowsAgentUrl().replace(/\/$/, "");
}

function mapAgentError(message: string, providerId: "windows" | "usb" = "windows"): PrintResult {
  return {
    success: false,
    providerId,
    errorMessage: message,
    printerState: "offline",
  };
}

async function postAgent<T extends Record<string, unknown>>(
  path: string,
  body: T
): Promise<{ ok: boolean; status: number; payload: Record<string, unknown> }> {
  const res = await fetchWithTimeout(
    `${agentBaseUrl()}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    AGENT_TIMEOUT_MS
  );

  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, payload };
}

function documentEndpoint(type: PrintDocumentType): "/v1/print/receipt" | "/v1/print/kitchen" {
  return type === "receipt" ? "/v1/print/receipt" : "/v1/print/kitchen";
}

/** Browser → local Print Agent (127.0.0.1:9211). Never hits the cloud server. */
export async function printViaLocalAgent(options: {
  type: PrintDocumentType;
  printerName: string;
  escpos: Uint8Array;
  orderNumber?: string;
  stationName?: string;
  providerId?: "windows" | "usb";
}): Promise<PrintResult> {
  if (isPosEmergencyDebug()) {
    posDebugLog("LOCAL PRINT AGENT BYPASS", {
      type: options.type,
      printer: options.printerName,
    });
    return { ...debugPrintSuccess(options.providerId ?? "windows"), providerId: options.providerId ?? "windows" };
  }

  const providerId = options.providerId ?? "windows";
  const printer = options.printerName.trim();

  try {
    const { ok, status, payload } = await postAgent(documentEndpoint(options.type), {
      printer: printer || undefined,
      base64: uint8ToBase64(options.escpos),
      orderNumber: options.orderNumber,
      station: options.stationName,
    });

    if (!ok || payload.success === false) {
      return mapAgentError(
        typeof payload.error === "string"
          ? payload.error
          : `Local print agent failed (${status}). Is npm run print-agent running on this terminal?`,
        providerId
      );
    }

    return { success: true, providerId };
  } catch (err) {
    return mapAgentError(
      err instanceof Error
        ? err.message
        : "Could not reach local print agent at 127.0.0.1:9211.",
      providerId
    );
  }
}

/** Low-level RAW job via local agent. */
export async function postWindowsRawJob(
  printerName: string,
  bytes: Uint8Array,
  meta?: { drawerOnly?: boolean; providerId?: "windows" | "usb"; documentType?: PrintDocumentType; orderNumber?: string; stationName?: string }
): Promise<PrintResult> {
  if (isPosEmergencyDebug()) {
    posDebugLog("LOCAL PRINT AGENT RAW BYPASS", { printer: printerName });
    return { ...debugPrintSuccess(meta?.providerId ?? "windows"), providerId: meta?.providerId ?? "windows" };
  }

  const providerId = meta?.providerId ?? "windows";

  if (meta?.drawerOnly) {
    return openDrawerViaLocalAgent(printerName, providerId);
  }

  if (meta?.documentType) {
    return printViaLocalAgent({
      type: meta.documentType,
      printerName,
      escpos: bytes,
      orderNumber: meta.orderNumber,
      stationName: meta.stationName,
      providerId,
    });
  }

  try {
    const { ok, status, payload } = await postAgent("/v1/print/raw", {
      printer: printerName.trim() || undefined,
      base64: uint8ToBase64(bytes),
      orderNumber: meta?.orderNumber,
    });

    if (!ok || payload.success === false) {
      return mapAgentError(
        typeof payload.error === "string"
          ? payload.error
          : `Local print agent RAW failed (${status}).`,
        providerId
      );
    }

    return { success: true, providerId };
  } catch (err) {
    return mapAgentError(
      err instanceof Error ? err.message : "Local print agent unreachable.",
      providerId
    );
  }
}

export async function openDrawerViaLocalAgent(
  printerName: string,
  providerId: "windows" | "usb" = "windows"
): Promise<PrintResult> {
  if (isPosEmergencyDebug()) {
    posDebugLog("LOCAL DRAWER BYPASS", { printer: printerName });
    return { success: true, providerId };
  }

  try {
    const { ok, status, payload } = await postAgent("/v1/drawer/open", {
      printer: printerName.trim() || undefined,
    });

    if (!ok || payload.success === false) {
      return mapAgentError(
        typeof payload.error === "string"
          ? payload.error
          : `Cash drawer request failed (${status}).`,
        providerId
      );
    }

    return { success: true, providerId };
  } catch (err) {
    return mapAgentError(
      err instanceof Error ? err.message : "Local print agent unreachable for drawer.",
      providerId
    );
  }
}

export async function fetchLocalAgentStatus(): Promise<LocalPrintAgentStatus | null> {
  try {
    const res = await fetchWithTimeout(`${agentBaseUrl()}/v1/status`, {}, 4_000);
    if (!res.ok) return null;
    const data = (await res.json()) as LocalPrintAgentStatus;
    return data;
  } catch {
    return null;
  }
}

export async function fetchLocalAgentPrinters(): Promise<
  Array<{ name: string; isDefault: boolean; roles: string[] }>
> {
  try {
    const res = await fetchWithTimeout(`${agentBaseUrl()}/v1/printers`, {}, 5_000);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      printers?: Array<{ name: string; isDefault: boolean; roles: string[] }>;
    };
    return data.printers ?? [];
  } catch {
    return [];
  }
}

export async function isLocalPrintAgentReachable(): Promise<boolean> {
  const status = await fetchLocalAgentStatus();
  return Boolean(status?.ok);
}
