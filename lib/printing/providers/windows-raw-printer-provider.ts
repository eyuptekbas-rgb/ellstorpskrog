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
import {
  explainWindowsCanPrint,
  traceBeforeCanPrint,
  traceCanPrintResult,
} from "@/lib/printing/print-trace-runtime";

function resolvePrinterName(): string | null {
  return resolveWindowsPrinterName(getActiveRegisteredPrinter() ?? undefined);
}

export const windowsRawPrinterProvider: PrinterProvider = {
  id: "windows",
  label: "Windows (RAW spooler)",
  canPrint() {
    traceBeforeCanPrint(windowsRawPrinterProvider);
    const canPrint = isWindowsPrinterConfigured(getActiveRegisteredPrinter() ?? undefined);
    traceCanPrintResult(windowsRawPrinterProvider, canPrint);
    if (!canPrint) {
      console.info("[PRINT-TRACE] windows canPrint() false — missing fields", {
        diagnostics: explainWindowsCanPrint(),
      });
    }
    return canPrint;
  },
  async print(document: PrintDocument): Promise<PrintResult> {
    const printerName = resolvePrinterName();
    if (!printerName) {
      return {
        success: false,
        providerId: "windows",
        errorMessage:
          "Windows-skrivare är inte konfigurerad. Ange skrivarnamn under Restaurang → Skrivare.",
        printerState: "offline",
      };
    }

    return postWindowsRawJob(printerName, document.escpos, {
      providerId: "windows",
      documentType: document.type,
    });
  },
};

export const windowsCashDrawerProvider: CashDrawerProvider = {
  id: "windows",
  label: "Windows (RAW spooler)",
  canOpen() {
    return isWindowsPrinterConfigured(getActiveRegisteredPrinter() ?? undefined);
  },
  async open() {
    const printerName = resolvePrinterName();
    if (!printerName) {
      return {
        success: false,
        errorMessage: "Windows-skrivare är inte konfigurerad.",
      };
    }

    const result = await openDrawerViaLocalAgent(printerName, "windows");

    return {
      success: result.success,
      errorMessage: result.errorMessage,
    };
  },
};

/** @deprecated Use windowsRawPrinterProvider */
export const windowsPrinterProvider = windowsRawPrinterProvider;
