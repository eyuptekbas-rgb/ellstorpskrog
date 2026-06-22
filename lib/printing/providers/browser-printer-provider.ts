import type { PrinterProvider, PrintDocument, PrintResult } from "@/lib/printing/types";

/**
 * Browser fallback when no hardware provider is configured.
 * Browsers cannot access the Windows spooler or raw TCP sockets directly.
 */
export const browserPrinterProvider: PrinterProvider = {
  id: "browser",
  label: "Browser (ingen skrivare)",
  canPrint() {
    return false;
  },
  async print(_document: PrintDocument): Promise<PrintResult> {
    void _document;
    return {
      success: false,
      providerId: "browser",
      errorMessage:
        "Ingen skrivare konfigurerad. Konfigurera Windows RAW (lokal agent) eller nätverksskrivare under Restaurang → Skrivare.",
      printerState: "offline",
    };
  },
};
