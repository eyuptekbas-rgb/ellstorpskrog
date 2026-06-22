import {
  isPosEmergencyDebug,
  posDebugLog,
  debugPrintSuccess,
} from "@/lib/debug/pos-emergency-debug";
import {
  androidPrinterProvider,
  browserPrinterProvider,
  networkPrinterProvider,
  usbPrinterProvider,
  windowsRawPrinterProvider,
} from "./providers";
import {
  buildKitchenTicketDocument,
  buildReceiptDocument,
} from "./receipt";
import type { EscPosPrintContext } from "./escpos-context";
import type {
  PrintDocument,
  PrintResult,
  PrintableOrder,
  PrinterProvider,
} from "./types";
import {
  traceBeforeCanPrint,
  traceCanPrintResult,
  traceNoPrinterConfiguredToast,
} from "./print-trace-runtime";

const providers: PrinterProvider[] = [
  windowsRawPrinterProvider,
  usbPrinterProvider,
  networkPrinterProvider,
  androidPrinterProvider,
  browserPrinterProvider,
];

function providerPriority(): string[] {
  if (typeof navigator !== "undefined" && /Win/i.test(navigator.userAgent)) {
    return ["windows", "usb", "network", "android", "browser"];
  }
  return ["network", "windows", "usb", "android", "browser"];
}

function pickDefaultProvider(): PrinterProvider {
  for (const id of providerPriority()) {
    const match = providers.find((provider) => provider.id === id);
    if (!match) continue;
    traceBeforeCanPrint(match);
    const canPrint = match.canPrint();
    traceCanPrintResult(match, canPrint);
    if (canPrint) {
      console.info("[PRINT-TRACE] pickDefaultProvider selected", { providerId: match.id });
      return match;
    }
  }
  console.info("[PRINT-TRACE] pickDefaultProvider falling back to browser");
  return browserPrinterProvider;
}

let activeProvider: PrinterProvider = pickDefaultProvider();

export function listPrinterProviders(): PrinterProvider[] {
  return providers;
}

export function setPrinterProvider(id: string): boolean {
  const match = providers.find((provider) => provider.id === id);
  if (!match) return false;
  activeProvider = match;
  return true;
}

export function getPrinterProvider(): PrinterProvider {
  return activeProvider;
}

export async function printDocument(
  document: PrintDocument
): Promise<PrintResult> {
  if (isPosEmergencyDebug()) {
    posDebugLog("PRINT BYPASS", { type: document.type, bytes: document.escpos.length });
    return debugPrintSuccess();
  }

  traceBeforeCanPrint(activeProvider);
  const activeCanPrint = activeProvider.canPrint();
  traceCanPrintResult(activeProvider, activeCanPrint);

  const provider = activeCanPrint ? activeProvider : pickDefaultProvider();

  traceBeforeCanPrint(provider);
  const providerCanPrint = provider.canPrint();
  traceCanPrintResult(provider, providerCanPrint);

  if (!providerCanPrint) {
    const result: PrintResult = {
      success: false,
      providerId: provider.id,
      errorMessage:
        "Ingen skrivare konfigurerad. Konfigurera Windows RAW eller nätverksskrivare under Restaurang → Skrivare.",
      printerState: "offline",
    };
    traceNoPrinterConfiguredToast("Utskrift", result, {
      stage: "printDocument.canPrint",
      activeProviderId: activeProvider.id,
      selectedProviderId: provider.id,
      providerPriority: providerPriority(),
    });
    return result;
  }

  return provider.print(document);
}

export async function printReceipt(
  order: PrintableOrder,
  restaurantName: string,
  context: EscPosPrintContext = {}
): Promise<PrintResult> {
  return printDocument(buildReceiptDocument(order, restaurantName, context));
}

export async function printKitchenTicket(
  order: PrintableOrder,
  restaurantName: string,
  context: EscPosPrintContext = {}
): Promise<PrintResult> {
  return printDocument(buildKitchenTicketDocument(order, restaurantName, context));
}

export async function reprintReceipt(
  order: PrintableOrder,
  restaurantName: string,
  context: EscPosPrintContext = {}
): Promise<PrintResult> {
  return printReceipt(order, restaurantName, context);
}
