import {
  isWindowsPrinterConfigured,
  resolveWindowsPrinterName,
} from "@/lib/printing/config/windows-printer-config";
import { getActiveRegisteredPrinter } from "@/lib/printing/active-printer-context";
import { openDrawerViaLocalAgent, postWindowsRawJob } from "@/lib/printing/transport/print-agent-client";
import type {
  CashDrawerProvider,
  PrinterProvider,
  PrintDocument,
  PrintResult,
} from "@/lib/printing/types";

/**
 * USB thermal printers on Windows POS terminals (e.g. ZQ-P1088 internal printer)
 * are exposed via the Windows spooler — never TCP sockets.
 */
function resolvePrinterName(): string | null {
  return resolveWindowsPrinterName(getActiveRegisteredPrinter() ?? undefined);
}

export const usbPrinterProvider: PrinterProvider = {
  id: "usb",
  label: "USB (Windows RAW)",
  canPrint() {
    return isWindowsPrinterConfigured(getActiveRegisteredPrinter() ?? undefined);
  },
  async print(document: PrintDocument): Promise<PrintResult> {
    const printerName = resolvePrinterName();
    if (!printerName) {
      return {
        success: false,
        providerId: "usb",
        errorMessage:
          "USB-skrivare är inte konfigurerad. Ange Windows-skrivarnamn under Restaurang → Skrivare.",
        printerState: "offline",
      };
    }

    return postWindowsRawJob(printerName, document.escpos, {
      providerId: "usb",
      documentType: document.type,
    });
  },
};

export const usbCashDrawerProvider: CashDrawerProvider = {
  id: "usb",
  label: "USB (Windows RAW)",
  canOpen() {
    return isWindowsPrinterConfigured(getActiveRegisteredPrinter() ?? undefined);
  },
  async open() {
    const printerName = resolvePrinterName();
    if (!printerName) {
      return {
        success: false,
        errorMessage: "USB-skrivare är inte konfigurerad.",
      };
    }

    const result = await openDrawerViaLocalAgent(printerName, "usb");

    return {
      success: result.success,
      errorMessage: result.errorMessage,
    };
  },
};

/** @deprecated Use usbCashDrawerProvider */
export const usbDrawer = usbCashDrawerProvider;
