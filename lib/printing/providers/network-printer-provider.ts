import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";
import { getActiveRegisteredPrinter } from "@/lib/printing/active-printer-context";
import {
  loadNetworkEscPosSettings,
  type NetworkEscPosSettings,
} from "@/lib/printing/config/network-escpos-config";
import { resolveEscPosConfig } from "@/lib/printing/escpos/config";
import { resolvePrinterStatusTargets } from "@/lib/printing/printer-status-targets";
import { postNetworkEscPosJob } from "@/lib/printing/transport/network-escpos-client";
import type {
  CashDrawerProvider,
  PrinterProvider,
  PrintDocument,
  PrintResult,
} from "@/lib/printing/types";

export const NETWORK_PRINTER_STORAGE_KEY = "rms-escpos-network";
export const PRINTER_STATUS_FETCH_TIMEOUT_MS = 3_000;

export type { NetworkEscPosSettings };

export function loadNetworkEscPosSettingsLegacy(): NetworkEscPosSettings {
  return loadNetworkEscPosSettings();
}

export function saveNetworkEscPosSettings(settings: NetworkEscPosSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NETWORK_PRINTER_STORAGE_KEY, JSON.stringify(settings));
}

function resolveNetworkTarget(): { host: string; port: number } | null {
  const printer = getActiveRegisteredPrinter();
  const config = resolveEscPosConfig(printer ?? undefined);
  const host = config.host.trim();
  if (!host || !config.enabled) return null;
  return { host, port: config.port };
}

export const networkPrinterProvider: PrinterProvider = {
  id: "network",
  label: "Nätverk (TCP 9100)",
  canPrint() {
    return resolveNetworkTarget() !== null;
  },
  async print(document: PrintDocument): Promise<PrintResult> {
    const target = resolveNetworkTarget();
    if (!target) {
      return {
        success: false,
        providerId: "network",
        errorMessage: "Nätverksskrivare är inte konfigurerad.",
        printerState: "offline",
      };
    }
    return postNetworkEscPosJob(target.host, target.port, document.escpos, {
      skipStatusCheck: true,
    });
  },
};

export const networkCashDrawerProvider: CashDrawerProvider = {
  id: "network",
  label: "Nätverk (TCP 9100)",
  canOpen() {
    return resolveNetworkTarget() !== null;
  },
  async open() {
    const target = resolveNetworkTarget();
    if (!target) {
      return {
        success: false,
        errorMessage: "Nätverksskrivare är inte konfigurerad.",
      };
    }

    const { encodeCashDrawerKick } = await import("../escpos/cash-drawer");
    const result = await postNetworkEscPosJob(
      target.host,
      target.port,
      encodeCashDrawerKick(),
      { drawerOnly: true, skipStatusCheck: true }
    );

    return {
      success: result.success,
      errorMessage: result.errorMessage,
    };
  },
};

/** Check status of explicitly configured network printers (never probes default IP unless enabled). */
export async function checkNetworkPrinterStatus(): Promise<{
  configured: boolean;
  statuses: Array<{
    id: string;
    name: string;
    host: string;
    port: number;
    online: boolean;
    paperOut: boolean;
    coverOpen: boolean;
    busy: boolean;
    error?: string;
  }>;
}> {
  if (isPosEmergencyDebug()) {
    posDebugLog("PRINTER STATUS PROBE BYPASS");
    return { configured: false, statuses: [] };
  }

  const targets = resolvePrinterStatusTargets();

  if (targets.length === 0) {
    return { configured: false, statuses: [] };
  }

  try {
    const res = await fetchWithTimeout(
      "/api/admin/print/status",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printers: targets }),
      },
      PRINTER_STATUS_FETCH_TIMEOUT_MS
    );
    if (!res.ok) return { configured: true, statuses: [] };
    const data = (await res.json()) as {
      statuses: Array<{
        id: string;
        name: string;
        host: string;
        port: number;
        online: boolean;
        paperOut: boolean;
        coverOpen: boolean;
        busy?: boolean;
        error?: string;
      }>;
    };
    return {
      configured: true,
      statuses: (data.statuses ?? []).map((s) => ({ ...s, busy: s.busy ?? false })),
    };
  } catch {
    return { configured: true, statuses: [] };
  }
}

/** Discover reachable printers on a subnet (client triggers server probe). */
export async function discoverNetworkPrinters(
  hosts: string[],
  port = 9100
): Promise<Array<{ host: string; port: number; reachable: boolean; latencyMs?: number }>> {
  if (isPosEmergencyDebug()) {
    posDebugLog("PRINTER DISCOVERY BYPASS");
    return [];
  }

  try {
    const res = await fetch("/api/admin/print/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hosts, port }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results: Array<{ host: string; port: number; reachable: boolean; latencyMs?: number }>;
    };
    return data.results ?? [];
  } catch {
    return [];
  }
}
