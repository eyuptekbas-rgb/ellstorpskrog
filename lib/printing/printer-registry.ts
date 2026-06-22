export type PrinterRole = "kitchen" | "receipt" | "bar" | "dessert";

import { traceResolvePrinterForRole } from "./print-trace-runtime";

export type RegisteredPrinter = {
  id: string;
  name: string;
  role: PrinterRole;
  providerId: string;
  categoryIds: string[];
  enabled: boolean;
  /** Network ESC/POS host override (optional). */
  networkHost?: string;
  /** Network ESC/POS port override (default 9100). */
  networkPort?: number;
  /** Windows spooler printer name (USB/internal thermal on POS terminals). */
  windowsPrinterName?: string;
};

const STORAGE_KEY = "rms-printer-registry";
const LEGACY_STORAGE_KEYS = ["rms-printers", "rms-printer-config"];

export const PRINTER_ROLE_LABELS: Record<PrinterRole, string> = {
  kitchen: "Kök",
  receipt: "Kvitto",
  bar: "Bar",
  dessert: "Dessert",
};

function normalizeProviderId(providerId: string): string {
  const normalized = providerId.trim().toLowerCase();
  if (normalized === "network-escpos") return "network";
  if (normalized === "windows-raw") return "windows";
  if (normalized === "windows-spooler") return "windows";
  if (normalized === "windowsraw") return "windows";
  if (normalized === "usb-raw") return "usb";
  if (normalized === "usbraw") return "usb";
  return normalized;
}

function normalizePrinter(printer: RegisteredPrinter): RegisteredPrinter {
  return {
    ...printer,
    providerId: normalizeProviderId(printer.providerId),
  };
}

export function loadPrinterRegistry(): RegisteredPrinter[] {
  if (typeof window === "undefined") return defaultPrinters();
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS
        .map((key) => localStorage.getItem(key))
        .find((value) => Boolean(value));
    if (!raw) {
      console.info("[PRINT-TRACE] Printer registry empty, using defaults", {
        key: STORAGE_KEY,
      });
      return defaultPrinters();
    }
    const parsed = JSON.parse(raw) as RegisteredPrinter[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.info("[PRINT-TRACE] Printer registry parsed empty, using defaults");
      return defaultPrinters();
    }
    const normalized = parsed.map(normalizePrinter);
    console.info("[PRINT-TRACE] Loaded printer registry", {
      count: normalized.length,
      printers: normalized.map((p) => ({
        id: p.id,
        role: p.role,
        providerId: p.providerId,
        windowsPrinterName: p.windowsPrinterName ?? null,
        enabled: p.enabled,
      })),
    });
    return normalized;
  } catch {
    console.info("[PRINT-TRACE] Printer registry parse failed, using defaults");
    return defaultPrinters();
  }
}

export function savePrinterRegistry(printers: RegisteredPrinter[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(printers.map(normalizePrinter))
  );
}

function defaultPrinters(): RegisteredPrinter[] {
  return [
    {
      id: "kitchen-default",
      name: "Köksprinter",
      role: "kitchen",
      providerId: "network",
      categoryIds: [],
      enabled: true,
    },
    {
      id: "receipt-default",
      name: "Kvitto",
      role: "receipt",
      providerId: "windows",
      categoryIds: [],
      enabled: true,
    },
    {
      id: "bar-default",
      name: "Bar",
      role: "bar",
      providerId: "network",
      categoryIds: [],
      enabled: true,
    },
    {
      id: "dessert-default",
      name: "Dessert",
      role: "dessert",
      providerId: "network",
      categoryIds: [],
      enabled: true,
    },
  ];
}

export function resolvePrinterForRole(
  role: PrinterRole,
  categoryId?: string
): RegisteredPrinter | null {
  const printers = loadPrinterRegistry().filter((p) => p.enabled && p.role === role);
  console.info("[PRINT-TRACE] resolvePrinterForRole", {
    role,
    categoryId: categoryId ?? null,
    candidates: printers.map((p) => ({
      id: p.id,
      providerId: p.providerId,
      windowsPrinterName: p.windowsPrinterName ?? null,
    })),
  });
  if (categoryId) {
    const matched = printers.find((p) => p.categoryIds.includes(categoryId));
    if (matched) {
      console.info("[PRINT-TRACE] resolvePrinterForRole matched category", {
        role,
        categoryId,
        printerId: matched.id,
      });
      traceResolvePrinterForRole(role, categoryId, matched);
      return matched;
    }
  }
  const fallback = printers[0] ?? null;
  console.info("[PRINT-TRACE] resolvePrinterForRole fallback", {
    role,
    printerId: fallback?.id ?? null,
  });
  traceResolvePrinterForRole(role, categoryId, fallback);
  return fallback;
}
