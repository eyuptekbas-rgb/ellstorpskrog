import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import {
  debugPrintSuccess,
  isPosEmergencyDebug,
  posDebugLog,
} from "@/lib/debug/pos-emergency-debug";
import { loadTerminalSettings } from "@/lib/rms/settings";
import { toPrintableOrder } from "@/lib/pos/printable-order";
import {
  hasAutoPrintCompleted,
  markAutoPrintCompleted,
} from "./print-dedup";
import {
  markPrinterPrinting,
  markPrinterResult,
} from "./printer-status";
import type { PrinterRole } from "./printer-registry";
import {
  printRoutedKitchenTicket,
  printRoutedReceipt,
  type RoutedPrintOptions,
} from "./routing";
import { splitOrderByStation, stationLabel } from "./station-routing";
import type { PrintResult } from "./types";

export type AutoPrintOptions = RoutedPrintOptions & {
  /** Bypass deduplication (manual reprint). */
  force?: boolean;
  /** Print customer receipt in addition to kitchen tickets. */
  includeReceipt?: boolean;
  /** POS mode: always print kitchen stations for NEW orders. */
  posMode?: boolean;
};

async function printKitchenStation(
  orderId: string,
  role: Extract<PrinterRole, "kitchen" | "bar" | "dessert">,
  order: ReturnType<typeof toPrintableOrder>,
  restaurantName: string,
  options: AutoPrintOptions
): Promise<PrintResult | null> {
  if (
    !options.force &&
    hasAutoPrintCompleted({
      orderId,
      role,
      documentType: "kitchen-ticket",
    })
  ) {
    return null;
  }

  markPrinterPrinting(`${stationLabel(role)} ${order.orderNumber}`);

  const result = await printRoutedKitchenTicket(order, restaurantName, role, {
    ...options,
    autoRetry: true,
  });

  markPrinterResult(result.success, result.errorMessage, result.printerState);

  if (result.success) {
    markAutoPrintCompleted({
      orderId,
      role,
      documentType: "kitchen-ticket",
    });
  }

  return result;
}

async function printCustomerReceipt(
  orderId: string,
  order: ReturnType<typeof toPrintableOrder>,
  restaurantName: string,
  options: AutoPrintOptions
): Promise<PrintResult | null> {
  if (
    !options.force &&
    hasAutoPrintCompleted({
      orderId,
      role: "receipt",
      documentType: "receipt",
    })
  ) {
    return null;
  }

  markPrinterPrinting(`Kvitto ${order.orderNumber}`);

  const result = await printRoutedReceipt(order, restaurantName, {
    ...options,
    autoRetry: true,
  });

  markPrinterResult(result.success, result.errorMessage, result.printerState);

  if (result.success) {
    markAutoPrintCompleted({
      orderId,
      role: "receipt",
      documentType: "receipt",
    });
  }

  return result;
}

/** Auto-print kitchen/bar/dessert tickets and optional receipt for a NEW order. */
export async function autoPrintNewOrder(
  order: AdminOrderListItem,
  restaurantName: string,
  options: AutoPrintOptions = {}
): Promise<PrintResult[]> {
  if (isPosEmergencyDebug()) {
    posDebugLog("AUTO PRINT BYPASS", order.orderNumber);
    return [debugPrintSuccess()];
  }

  const settings = loadTerminalSettings();
  const printable = toPrintableOrder(order);
  const results: PrintResult[] = [];

  const printKitchen =
    options.posMode || options.force || settings.autoPrintKitchen;
  const printReceipt =
    options.includeReceipt ||
    options.force ||
    options.posMode ||
    settings.autoPrintReceipt;

  if (printKitchen) {
    const stations = splitOrderByStation(printable);
    const roles = Object.keys(stations) as Array<
      Extract<PrinterRole, "kitchen" | "bar" | "dessert">
    >;

    if (roles.length === 0 && printable.items.length > 0) {
      const result = await printKitchenStation(
        order.id,
        "kitchen",
        printable,
        restaurantName,
        options
      );
      if (result) results.push(result);
    } else {
      for (const role of roles) {
        const stationOrder = stations[role];
        if (!stationOrder) continue;
        const result = await printKitchenStation(
          order.id,
          role,
          stationOrder,
          restaurantName,
          options
        );
        if (result) results.push(result);
      }
    }
  }

  if (printReceipt) {
    const receiptResult = await printCustomerReceipt(
      order.id,
      printable,
      restaurantName,
      options
    );
    if (receiptResult) results.push(receiptResult);
  }

  return results;
}

/** Manual reprint — kitchen stations + customer receipt, bypasses dedup. */
export async function reprintOrder(
  order: AdminOrderListItem,
  restaurantName: string,
  options: RoutedPrintOptions = {}
): Promise<PrintResult[]> {
  return autoPrintNewOrder(order, restaurantName, {
    ...options,
    force: true,
    includeReceipt: true,
    posMode: true,
  });
}
