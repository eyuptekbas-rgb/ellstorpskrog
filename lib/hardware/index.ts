/** Hardware provider interfaces and implementations for POS peripherals. */

export type HardwareProviderStatus = "available" | "unavailable" | "stub";

export type EscPosNetworkConfig = {
  host: string;
  port: number;
};

export type EscPosNetworkProvider = {
  readonly kind: "escpos-network";
  readonly id: string;
  readonly label: string;
  status(): HardwareProviderStatus;
  printRaw(data: Uint8Array, config: EscPosNetworkConfig): Promise<{ success: boolean; error?: string }>;
};

export type UsbPrinterProvider = {
  readonly kind: "usb";
  readonly id: string;
  readonly label: string;
  status(): HardwareProviderStatus;
  printRaw(data: Uint8Array): Promise<{ success: boolean; error?: string }>;
};

export type WindowsPrintProvider = {
  readonly kind: "windows-print";
  readonly id: string;
  readonly label: string;
  status(): HardwareProviderStatus;
  printRaw(data: Uint8Array, printerName?: string): Promise<{ success: boolean; error?: string }>;
  printHtml(html: string, printerName?: string): Promise<{ success: boolean; error?: string }>;
};

export type AndroidPrintProvider = {
  readonly kind: "android-print";
  readonly id: string;
  readonly label: string;
  status(): HardwareProviderStatus;
  printHtml(html: string): Promise<{ success: boolean; error?: string }>;
};

export type CashDrawerKickProvider = {
  readonly kind: "cash-drawer";
  readonly id: string;
  readonly label: string;
  status(): HardwareProviderStatus;
  open(): Promise<{ success: boolean; error?: string }>;
};

export type BarcodeScanEvent = {
  code: string;
  format?: string;
  at: string;
};

export type BarcodeScannerProvider = {
  readonly kind: "barcode-scanner";
  readonly id: string;
  readonly label: string;
  status(): HardwareProviderStatus;
  subscribe(onScan: (event: BarcodeScanEvent) => void): () => void;
};

export type CustomerDisplayLine = {
  text: string;
  size?: "sm" | "md" | "lg";
};

export type CustomerDisplayProvider = {
  readonly kind: "customer-display";
  readonly id: string;
  readonly label: string;
  status(): HardwareProviderStatus;
  show(lines: CustomerDisplayLine[]): Promise<{ success: boolean; error?: string }>;
  clear(): Promise<{ success: boolean; error?: string }>;
};

export type HardwareProvider =
  | EscPosNetworkProvider
  | UsbPrinterProvider
  | WindowsPrintProvider
  | AndroidPrintProvider
  | CashDrawerKickProvider
  | BarcodeScannerProvider
  | CustomerDisplayProvider;

import { createCompositeBarcodeScanner } from "./barcode";
import { resolveEscPosConfig } from "@/lib/printing/escpos/config";
import { openCashDrawer } from "@/lib/printing/cash-drawer";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";
import {
  isWindowsPrinterConfigured,
  loadWindowsPrinterSettings,
} from "@/lib/printing/config/windows-printer-config";
import { postWindowsRawJob } from "@/lib/printing/transport/print-agent-client";
import { postNetworkEscPosJob } from "@/lib/printing/transport/network-escpos-client";

const escposNetworkProvider: EscPosNetworkProvider = {
  kind: "escpos-network",
  id: "escpos-network",
  label: "ESC/POS Network",
  status() {
    const config = resolveEscPosConfig();
    return config.enabled && config.host.trim() ? "available" : "unavailable";
  },
  async printRaw(data, config) {
    try {
      const result = await postNetworkEscPosJob(config.host, config.port, data, {
        skipStatusCheck: true,
      });
      return { success: result.success, error: result.errorMessage };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Print failed.",
      };
    }
  },
};

const usbHardwareProvider: UsbPrinterProvider = {
  kind: "usb",
  id: "usb",
  label: "USB Printer (Windows RAW)",
  status() {
    return isWindowsPrinterConfigured() ? "available" : "unavailable";
  },
  async printRaw(data) {
    const name = loadWindowsPrinterSettings().printerName.trim();
    if (!name) {
      return { success: false, error: "Windows printer name not configured." };
    }
    const result = await postWindowsRawJob(name, data, { providerId: "usb" });
    return { success: result.success, error: result.errorMessage };
  },
};

const windowsHardwareProvider: WindowsPrintProvider = {
  kind: "windows-print",
  id: "windows-print",
  label: "Windows Print (RAW ESC/POS)",
  status() {
    return isWindowsPrinterConfigured() ? "available" : "unavailable";
  },
  async printHtml(_html, _printerName?) {
    void _html;
    void _printerName;
    return {
      success: false,
      error: "HTML print is not supported. Use ESC/POS RAW via printRaw().",
    };
  },
  async printRaw(data: Uint8Array, printerName?: string) {
    const name = printerName?.trim() || loadWindowsPrinterSettings().printerName.trim();
    if (!name) {
      return { success: false, error: "Windows printer name not configured." };
    }
    const result = await postWindowsRawJob(name, data, { providerId: "windows" });
    return { success: result.success, error: result.errorMessage };
  },
};

const cashDrawerProvider: CashDrawerKickProvider = {
  kind: "cash-drawer",
  id: "cash-drawer",
  label: "Cash Drawer",
  status() {
    if (isWindowsPrinterConfigured()) return "available";
    return escposNetworkProvider.status();
  },
  async open() {
    if (isPosEmergencyDebug()) {
      posDebugLog("CASH DRAWER BYPASS");
      return { success: true };
    }
    const result = await openCashDrawer();
    return { success: result.success, error: result.errorMessage };
  },
};

const compositeBarcode = createCompositeBarcodeScanner();

export const hardwareProviders = {
  escposNetwork: escposNetworkProvider,
  usb: usbHardwareProvider,
  windowsPrint: windowsHardwareProvider,
  androidPrint: {
    kind: "android-print" as const,
    id: "android-print",
    label: "Android Print",
    status: () => "unavailable" as const,
    async printHtml() {
      return { success: false, error: "Android print service requires native wrapper." };
    },
  },
  cashDrawer: cashDrawerProvider,
  barcodeScanner: compositeBarcode,
  customerDisplay: {
    kind: "customer-display" as const,
    id: "customer-display-hardware",
    label: "Customer Display (software)",
    status: () => "available" as const,
    async show(lines: CustomerDisplayLine[]) {
      const { getCustomerDisplayProvider } = await import("@/lib/customer-display/provider");
      getCustomerDisplayProvider().push({
        phase: "ordering",
        lines: lines.map((l: CustomerDisplayLine) => ({ ...l, tone: "default" as const })),
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    },
    async clear() {
      const { getCustomerDisplayProvider } = await import("@/lib/customer-display/provider");
      getCustomerDisplayProvider().clear();
      return { success: true };
    },
  },
} as const;
