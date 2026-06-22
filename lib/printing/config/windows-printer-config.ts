const STORAGE_KEY = "rms-windows-printer";
const LEGACY_SPOOLER_KEY = "rms-windows-spooler-host";
const LEGACY_STORAGE_KEYS = [
  "rms-windows-printer-config",
  "windows-printer-config",
];

export type WindowsPrinterSettings = {
  /** Exact Windows printer name from Devices & Printers. */
  printerName: string;
  /** Local RAW print agent base URL (browser → spooler bridge). */
  agentUrl: string;
  enabled: boolean;
};

export const DEFAULT_WINDOWS_PRINTER: WindowsPrinterSettings = {
  printerName: "",
  agentUrl: "http://127.0.0.1:9211",
  enabled: true,
};

export function loadWindowsPrinterSettings(): WindowsPrinterSettings {
  if (typeof window === "undefined") return DEFAULT_WINDOWS_PRINTER;
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS
        .map((key) => localStorage.getItem(key))
        .find((value) => Boolean(value));
    if (raw) {
      const parsed = { ...DEFAULT_WINDOWS_PRINTER, ...JSON.parse(raw) };
      console.info("[PRINT-TRACE] Loaded windows printer settings", {
        key: STORAGE_KEY,
        printerName: parsed.printerName || null,
      });
      return parsed;
    }
    const legacy = localStorage.getItem(LEGACY_SPOOLER_KEY)?.trim();
    if (legacy) {
      console.info("[PRINT-TRACE] Loaded legacy windows printer setting", {
        key: LEGACY_SPOOLER_KEY,
        printerName: legacy,
      });
      return {
        ...DEFAULT_WINDOWS_PRINTER,
        printerName: legacy,
        enabled: true,
      };
    }
    console.info("[PRINT-TRACE] Windows printer settings empty", {
      tried: [STORAGE_KEY, ...LEGACY_STORAGE_KEYS, LEGACY_SPOOLER_KEY],
    });
    return DEFAULT_WINDOWS_PRINTER;
  } catch {
    console.info("[PRINT-TRACE] Windows printer settings parse failed");
    return DEFAULT_WINDOWS_PRINTER;
  }
}

export function saveWindowsPrinterSettings(settings: WindowsPrinterSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  if (settings.printerName) {
    localStorage.setItem(LEGACY_SPOOLER_KEY, settings.printerName);
  }
}

export function resolveWindowsPrinterName(printer?: {
  windowsPrinterName?: string;
}): string | null {
  const fromPrinter = printer?.windowsPrinterName?.trim();
  if (fromPrinter) return fromPrinter;
  const name = loadWindowsPrinterSettings().printerName.trim();
  return name || null;
}

export function resolveWindowsAgentUrl(): string {
  const global = loadWindowsPrinterSettings();
  const url = global.agentUrl.trim();
  return url || DEFAULT_WINDOWS_PRINTER.agentUrl;
}

export function isWindowsPrinterConfigured(printer?: {
  windowsPrinterName?: string;
}): boolean {
  return resolveWindowsPrinterName(printer) !== null;
}
