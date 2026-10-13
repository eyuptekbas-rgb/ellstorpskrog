import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import { OrderStatus } from "@prisma/client";
import { toPrintableOrder } from "@/lib/pos/printable-order";
import {
  hasReadyPrintCompleted,
  markReadyPrintCompleted,
} from "./print-dedup";
import { printRoutedReceipt } from "./routing";
import type { PrintResult } from "./types";

export type ReadyPrintOutcome = {
  skipped: boolean;
  result?: PrintResult;
};

/** Dispatch the customer/pickup receipt once after a persisted READY transition. */
export async function printReceiptOnReady(
  order: AdminOrderListItem,
  restaurantName: string
): Promise<ReadyPrintOutcome> {
  const key = {
    orderId: order.id,
    role: "receipt" as const,
    documentType: "receipt" as const,
  };

  if (hasReadyPrintCompleted(key)) return { skipped: true };

  const result = await printRoutedReceipt(
    toPrintableOrder({ ...order, status: OrderStatus.READY }),
    restaurantName,
    { autoRetry: true }
  );

  if (result.success) markReadyPrintCompleted(key);
  return { skipped: false, result };
}
