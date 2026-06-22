import { safeWriteOperationalAudit } from "@/lib/audit/audit-log";
import {
  debugPrintSuccess,
  isPosEmergencyDebug,
  posDebugLog,
} from "@/lib/debug/pos-emergency-debug";
import { setActiveRegisteredPrinter } from "./active-printer-context";
import {
  resolvePrinterForRole,
  type PrinterRole,
  type RegisteredPrinter,
} from "./printer-registry";
import { appendPrintHistory } from "./print-history";
import { enqueuePrintRetry } from "./print-queue";
import { stationLabel } from "./station-routing";
import {
  printKitchenTicket,
  printReceipt,
  setPrinterProvider,
  getPrinterProvider,
} from "./printer";
import type { PrintableOrder, PrintResult } from "./types";
import {
  explainWindowsCanPrint,
  traceActivatePrinter,
  traceNoPrinterConfiguredToast,
} from "./print-trace-runtime";

export type RoutedPrintOptions = {
  actorUserId?: string;
  tenantId?: string;
  categoryId?: string;
  autoRetry?: boolean;
};

function activatePrinter(printer: RegisteredPrinter | null): boolean {
  setActiveRegisteredPrinter(printer);
  if (!printer) {
    traceActivatePrinter(null, false, null);
    return false;
  }
  const providerSet = setPrinterProvider(printer.providerId);
  const provider = getPrinterProvider();
  traceActivatePrinter(printer, providerSet, provider);
  return providerSet;
}

export async function printRoutedReceipt(
  order: PrintableOrder,
  restaurantName: string,
  options: RoutedPrintOptions = {}
): Promise<PrintResult> {
  if (isPosEmergencyDebug()) {
    posDebugLog("ROUTED RECEIPT BYPASS", order.orderNumber);
    return debugPrintSuccess();
  }

  const printer =
    resolvePrinterForRole("receipt", options.categoryId) ??
    resolvePrinterForRole("kitchen", options.categoryId);
  if (!activatePrinter(printer)) {
    const result: PrintResult = {
      success: false,
      providerId: "none",
      errorMessage: "Ingen kvittoskrivare konfigurerad.",
    };
    console.info("[PRINT-TRACE] activatePrinter failed before print", {
      role: "receipt",
      resolvedPrinter: printer,
      windowsDiag: explainWindowsCanPrint(printer),
      result,
    });
    traceNoPrinterConfiguredToast("Kvitto", result, {
      stage: "activatePrinter",
      role: "receipt",
      resolvedPrinter: printer,
    });
    recordPrint("receipt", order.orderNumber, result, options, "receipt", order, restaurantName);
    return result;
  }

  const result = await printReceipt(order, restaurantName);
  if (!result.success) {
    traceNoPrinterConfiguredToast("Kvitto", result, {
      stage: "printReceipt",
      role: "receipt",
      resolvedPrinter: printer,
    });
  }
  recordPrint("receipt", order.orderNumber, result, options, "receipt", order, restaurantName);
  return result;
}

export async function printRoutedKitchenTicket(
  order: PrintableOrder,
  restaurantName: string,
  role: Extract<PrinterRole, "kitchen" | "bar" | "dessert"> = "kitchen",
  options: RoutedPrintOptions = {}
): Promise<PrintResult> {
  if (isPosEmergencyDebug()) {
    posDebugLog("ROUTED KITCHEN BYPASS", { order: order.orderNumber, role });
    return debugPrintSuccess();
  }

  const printer = resolvePrinterForRole(role, options.categoryId);
  if (!activatePrinter(printer)) {
    const result: PrintResult = {
      success: false,
      providerId: "none",
      errorMessage: "Ingen kökskrivare konfigurerad.",
    };
    recordPrint("kitchen-ticket", order.orderNumber, result, options, role, order, restaurantName);
    return result;
  }

  const result = await printKitchenTicket(order, restaurantName, {
    stationName: stationLabel(role),
    preparationMinutes: order.estimatedReadyMinutes ?? 15,
  });
  recordPrint("kitchen-ticket", order.orderNumber, result, options, role, order, restaurantName);
  return result;
}

function recordPrint(
  documentType: "receipt" | "kitchen-ticket",
  orderNumber: string,
  result: PrintResult,
  options: RoutedPrintOptions,
  role: PrinterRole | string = "receipt",
  order?: PrintableOrder,
  restaurantName = ""
) {
  appendPrintHistory({
    role: String(role),
    orderNumber,
    documentType,
    providerId: result.providerId,
    success: result.success,
    errorMessage: result.errorMessage,
  });

  void safeWriteOperationalAudit(
    options.tenantId ?? null,
    options.actorUserId,
    "printer",
    result.success ? "Utskrift lyckades" : "Utskrift misslyckades",
    `${documentType} · ${orderNumber} · ${result.providerId}${result.errorMessage ? ` · ${result.errorMessage}` : ""}`
  );

  if (
    !result.success &&
    options.autoRetry !== false &&
    typeof window !== "undefined" &&
    order
  ) {
    enqueuePrintRetry({
      role: role as PrinterRole,
      documentType,
      orderNumber,
      categoryId: options.categoryId,
      payload: order,
      restaurantName,
    });
  }
}

export async function autoPrintOnNewOrder(
  order: PrintableOrder,
  restaurantName: string,
  settings: { autoPrintKitchen: boolean; autoPrintReceipt: boolean },
  options: RoutedPrintOptions = {}
) {
  const { autoPrintNewOrder } = await import("./auto-print");
  return autoPrintNewOrder(
    {
      id: order.orderNumber,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      status: order.status,
      note: order.note,
      adminNote: order.adminNote,
      estimatedReadyMinutes: order.estimatedReadyMinutes ?? null,
      createdAt: order.createdAt,
      items: order.items.map((item, index) => ({
        id: `${order.orderNumber}-${index}`,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    },
    restaurantName,
    {
      ...options,
      posMode: settings.autoPrintKitchen,
      includeReceipt: settings.autoPrintReceipt,
    }
  );
}
