import { getActiveRegisteredPrinter } from "@/lib/printing/active-printer-context";
import {
  loadWindowsPrinterSettings,
  resolveWindowsPrinterName,
} from "@/lib/printing/config/windows-printer-config";
import { resolveEscPosConfig } from "@/lib/printing/escpos/config";
import type { RegisteredPrinter } from "@/lib/printing/printer-registry";
import type { PrintResult, PrinterProvider } from "@/lib/printing/types";

const TAG = "[PRINT-TRACE]";

export function traceRmsSettingsFromApi(data: Record<string, unknown> | null) {
  console.info(`${TAG} GET /api/settings response (RMS)`, {
    rmsTerminalSettings: data?.rmsTerminalSettings ?? null,
    rmsPrinterRegistry: data?.rmsPrinterRegistry ?? null,
    rmsEscposConfig: data?.rmsEscposConfig ?? null,
    rmsWindowsPrinterConfig: data?.rmsWindowsPrinterConfig ?? null,
  });
}

export function tracePosShellSettingsReceived(data: Record<string, unknown> | null) {
  console.info(`${TAG} PosShell received /api/settings`, {
    hasData: Boolean(data),
    rmsTerminalSettings: data?.rmsTerminalSettings ?? null,
    rmsPrinterRegistry: data?.rmsPrinterRegistry ?? null,
    rmsEscposConfig: data?.rmsEscposConfig ?? null,
    rmsWindowsPrinterConfig: data?.rmsWindowsPrinterConfig ?? null,
  });
}

export function tracePostHydration(
  registry: RegisteredPrinter[],
  windowsSettings: ReturnType<typeof loadWindowsPrinterSettings>
) {
  console.info(`${TAG} PosShell after hydration`, {
    loadPrinterRegistry: registry,
    loadWindowsPrinterSettings: windowsSettings,
    localStorage: {
      "rms-printer-registry": safeLocalStorageGet("rms-printer-registry"),
      "rms-windows-printer": safeLocalStorageGet("rms-windows-printer"),
    },
  });
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function traceResolvePrinterForRole(
  role: string,
  categoryId: string | undefined,
  resolved: RegisteredPrinter | null
) {
  console.info(`${TAG} resolvePrinterForRole result`, {
    role,
    categoryId: categoryId ?? null,
    resolvedPrinter: resolved,
    providerId: resolved?.providerId ?? null,
    windowsPrinterName: resolved?.windowsPrinterName ?? null,
    enabled: resolved?.enabled ?? null,
  });
}

export function traceActivatePrinter(
  printer: RegisteredPrinter | null,
  providerSet: boolean,
  provider: PrinterProvider | null
) {
  console.info(`${TAG} activatePrinter`, {
    printer,
    providerSet,
    providerSelected: provider?.id ?? null,
    providerLabel: provider?.label ?? null,
    providerInstance: provider
      ? { id: provider.id, label: provider.label }
      : null,
  });
}

export function explainWindowsCanPrint(printer?: RegisteredPrinter | null) {
  const active = printer ?? getActiveRegisteredPrinter();
  const windowsSettings = loadWindowsPrinterSettings();
  const fromRegistry = active?.windowsPrinterName?.trim() || null;
  const fromGlobal = windowsSettings.printerName.trim() || null;
  const resolvedName = resolveWindowsPrinterName(active ?? undefined);
  const canPrint = resolvedName !== null;

  const missing: string[] = [];
  if (!fromRegistry) {
    missing.push("registeredPrinter.windowsPrinterName is empty or missing");
  }
  if (!fromGlobal) {
    missing.push("windowsSettings.printerName is empty or missing");
  }
  if (!fromRegistry && !fromGlobal) {
    missing.push("no Windows printer name from registry or global settings");
  }
  if (windowsSettings.enabled === false) {
    missing.push("windowsSettings.enabled is false (informational — not checked by canPrint)");
  }

  return {
    activeRegisteredPrinter: active,
    windowsSettings,
    fromRegistry,
    fromGlobal,
    resolvedPrinterName: resolvedName,
    canPrint,
    missingFields: canPrint ? [] : missing,
  };
}

export function explainNetworkCanPrint(printer?: RegisteredPrinter | null) {
  const active = printer ?? getActiveRegisteredPrinter();
  const config = resolveEscPosConfig(active ?? undefined);
  const host = config.host.trim();
  const missing: string[] = [];

  if (!host) missing.push("escpos host is empty");
  if (!config.enabled) missing.push("escpos enabled is false");
  if (active && !active.networkHost && !config.enabled) {
    missing.push("no per-printer networkHost and global escpos disabled");
  }

  return {
    activeRegisteredPrinter: active,
    escposConfig: config,
    resolvedTarget: host && config.enabled ? { host, port: config.port } : null,
    canPrint: host !== "" && config.enabled,
    missingFields: host && config.enabled ? [] : missing,
  };
}

export function traceBeforeCanPrint(
  provider: PrinterProvider,
  printer?: RegisteredPrinter | null
) {
  const active = printer ?? getActiveRegisteredPrinter();
  const windowsDiag = explainWindowsCanPrint(active);
  const networkDiag = explainNetworkCanPrint(active);

  console.info(`${TAG} immediately before canPrint()`, {
    providerId: provider.id,
    providerLabel: provider.label,
    activeRegisteredPrinter: active,
    exactPrinterName:
      provider.id === "windows" || provider.id === "usb"
        ? windowsDiag.resolvedPrinterName
        : provider.id === "network"
          ? networkDiag.resolvedTarget
          : null,
    windowsDiag,
    networkDiag,
  });

  return { windowsDiag, networkDiag };
}

export function traceCanPrintResult(
  provider: PrinterProvider,
  canPrint: boolean,
  printer?: RegisteredPrinter | null
) {
  const active = printer ?? getActiveRegisteredPrinter();
  const windowsDiag = explainWindowsCanPrint(active);
  const networkDiag = explainNetworkCanPrint(active);

  const payload: Record<string, unknown> = {
    providerId: provider.id,
    canPrint,
    activeRegisteredPrinter: active,
  };

  if (!canPrint) {
    if (provider.id === "windows" || provider.id === "usb") {
      payload.why = windowsDiag;
    } else if (provider.id === "network") {
      payload.why = networkDiag;
    } else if (provider.id === "browser") {
      payload.why = {
        reason: "browser provider always returns false",
        missingFields: ["hardware printer provider not configured"],
      };
    } else if (provider.id === "android") {
      payload.why = {
        reason: "android provider not available in browser",
        missingFields: ["android print service"],
      };
    } else {
      payload.why = { reason: "unknown provider", missingFields: ["provider not recognized"] };
    }
  }

  console.info(`${TAG} canPrint() result`, payload);
  return payload;
}

export function traceNoPrinterConfiguredToast(
  label: string,
  result: PrintResult,
  context?: Record<string, unknown>
) {
  const isNoPrinter =
    !result.success &&
    (result.errorMessage?.toLowerCase().includes("konfigurerad") ||
      result.errorMessage?.toLowerCase().includes("configured") ||
      result.providerId === "browser" ||
      result.providerId === "none");

  if (!isNoPrinter) return;

  console.info(`${TAG} toast "No printer configured" imminent`, {
    label,
    printResult: result,
    activeRegisteredPrinter: getActiveRegisteredPrinter(),
    windowsSettings: loadWindowsPrinterSettings(),
    context: context ?? null,
  });
}
