import { formatOrderNumber } from "@/lib/orders";
import type { EscPosPrintContext } from "./escpos-context";
import { encodeKitchenTicket } from "./escpos/kitchen-ticket";
import {
  buildDefaultRestaurantInfo,
  buildReceiptPaymentInfo,
  encodeReceipt,
} from "./escpos/receipt";
import type { PrintableOrder, PrintDocument } from "./types";

export type ReceiptBuildOptions = EscPosPrintContext & {
  restaurantName: string;
};

export function buildReceiptDocument(
  order: PrintableOrder,
  restaurantName: string,
  options: EscPosPrintContext = {}
): PrintDocument {
  const restaurant = {
    ...buildDefaultRestaurantInfo(restaurantName),
    ...options.restaurant,
    name: options.restaurant?.name ?? restaurantName,
  };

  const payment = buildReceiptPaymentInfo(order);
  if (options.swishReference) payment.swishReference = options.swishReference;
  if (options.cardReference) payment.cardReference = options.cardReference;

  const escpos = encodeReceipt({
    order,
    restaurant,
    payment,
    cashier: options.cashier,
    tableLabel: options.tableLabel,
    discountTotal: options.discountTotal,
  });

  return {
    type: "receipt",
    title: `Kvitto ${formatOrderNumber(order.orderNumber)}`,
    escpos,
    context: options,
  };
}

export function buildKitchenTicketDocument(
  order: PrintableOrder,
  restaurantName: string,
  options: EscPosPrintContext = {}
): PrintDocument {
  const stationName = options.stationName ?? "KÖK";
  const restaurant = {
    ...buildDefaultRestaurantInfo(restaurantName),
    ...options.restaurant,
    name: options.restaurant?.name ?? restaurantName,
  };
  const payment = buildReceiptPaymentInfo(order);

  const escpos = encodeKitchenTicket({
    order,
    restaurantName,
    stationName,
    restaurant,
    payment,
    preparationMinutes:
      options.preparationMinutes ?? order.estimatedReadyMinutes ?? 15,
  });

  return {
    type: "kitchen-ticket",
    title: `${stationName} ${formatOrderNumber(order.orderNumber)}`,
    escpos,
    context: options,
  };
}

/** @deprecated HTML preview removed — use printKitchenTicket / printReceipt instead. */
export function buildKitchenTicketHtml(
  order: PrintableOrder,
  restaurantName: string
): string {
  void order;
  void restaurantName;
  return "";
}

/** @deprecated HTML preview removed — use printReceipt instead. */
export function buildReceiptHtml(order: PrintableOrder, restaurantName: string): string {
  void order;
  void restaurantName;
  return "";
}

export function buildCustomerReceiptHtml(
  order: PrintableOrder,
  restaurantName: string
): string {
  return buildReceiptHtml(order, restaurantName);
}

export function buildKitchenReceiptHtml(
  order: PrintableOrder,
  restaurantName: string
): string {
  return buildKitchenTicketHtml(order, restaurantName);
}

/** @deprecated Use printReceipt / printKitchenTicket — no browser print dialogs. */
export async function printOrderReceipt(html: string, title: string) {
  void html;
  void title;
  console.warn(
    "[printing] printOrderReceipt is deprecated. Configure ESC/POS and use printReceipt()."
  );
}
