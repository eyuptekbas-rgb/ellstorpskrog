import type { PrinterProvider, PrintDocument, PrintResult } from "@/lib/printing/types";

/** Android print service — not available in browser POS; configure on device natively. */
export const androidPrinterProvider: PrinterProvider = {
  id: "android",
  label: "Android Print Service",
  canPrint() {
    return false;
  },
  async print(_document: PrintDocument): Promise<PrintResult> {
    void _document;
    return {
      success: false,
      providerId: "android",
      errorMessage: "Android print service is not available in this client.",
      printerState: "offline",
    };
  },
};
