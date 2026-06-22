import { OrderType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { parseOrderItemDisplay } from "@/lib/cart";
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  formatOrderNumber,
} from "@/lib/orders";
import type { EscPosPaymentInfo, EscPosRestaurantInfo } from "./receipt";
import type { PrintableOrder, PrintableOrderItem } from "../types";
import { EscPosEncoder } from "./encoder";

export type EscPosKitchenTicketInput = {
  order: PrintableOrder;
  restaurantName: string;
  stationName: string;
  restaurant?: Partial<EscPosRestaurantInfo>;
  payment?: EscPosPaymentInfo;
  preparationMinutes?: number;
  lineWidth?: number;
};

const KITCHEN_LINE_SPACING = 28;
const VAT_RATE = 0.12;

function formatKr(amount: number): string {
  return `${Math.round(amount)} kr`;
}

function formatKrDecimal(amount: number): string {
  return (
    amount.toLocaleString("sv-SE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + " kr"
  );
}

function formatKitchenDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("sv-SE");
  const time = date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} ${time}`;
}

function formatReadyClock(iso: string, minutes: number): string {
  const ready = new Date(new Date(iso).getTime() + minutes * 60_000);
  return ready.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderTypeKitchenLabel(orderType: OrderType): string {
  return orderType === OrderType.DELIVERY ? "LEVERANS" : "AVHÄMTNING";
}

function paymentStatusKitchenLabel(status: PaymentStatus): string {
  return status === PaymentStatus.PAID ? "BETALD" : "OBETALD";
}

function kitchenPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Partial<Record<PaymentMethod, string>> = {
    CARD: "Kortbetalning",
    SWISH: "Swish",
    ON_PICKUP: "Betal vid avhämtning",
    ON_DELIVERY: "Betald online",
    APPLE_PAY: "Apple Pay",
    GOOGLE_PAY: "Google Pay",
  };
  return labels[method] ?? PAYMENT_LABELS[method];
}

function quantityPrefix(quantity: number): string {
  return `${quantity}st`;
}

function printItemHeader(
  encoder: EscPosEncoder,
  lineWidth: number,
  orderNumber: string,
  item: PrintableOrderItem,
  name: string
): void {
  const price = formatKr(item.totalPrice);
  const badge = `ORDER #${formatOrderNumber(orderNumber)}`;
  const namePart = `, ${name}`;
  const pad = Math.max(
    1,
    lineWidth - badge.length - 4 - namePart.length - price.length
  );

  encoder.size("large");
  encoder.lineSegments([
    { text: ` ${badge} `, reverse: true, bold: true },
    { text: `${namePart}${" ".repeat(pad)}${price}`, bold: true },
  ]);
  encoder.size("normal").bold(false);
}

function printItemSubtotal(encoder: EscPosEncoder, totalPrice: number): void {
  encoder.align("right");
  encoder.size("normal");
  encoder.blackLabel(`=${formatKr(totalPrice)}`, "right");
  encoder.align("left");
}

function printProductBlock(
  encoder: EscPosEncoder,
  lineWidth: number,
  orderNumber: string,
  item: PrintableOrderItem
) {
  const { name, options: extras, note } = parseOrderItemDisplay(item.productName);
  const prefix = quantityPrefix(item.quantity);

  printItemHeader(encoder, lineWidth, orderNumber, item, name);

  for (const extra of extras) {
    encoder.columns(`  ${prefix} Ingår: ${extra}`, "+0kr");
  }

  if (note) {
    encoder.columns(`  ${prefix} -${note}`, "");
  }

  printItemSubtotal(encoder, item.totalPrice);
}

function printOrderComment(encoder: EscPosEncoder, note: string): void {
  encoder.rule("-");
  encoder.bold().line("Meddelande").bold(false);
  encoder.bold().line(note.trim().toUpperCase()).bold(false);
  encoder.rule("-");
}

/** Encode a kitchen ticket as ESC/POS bytes. */
export function encodeKitchenTicket(input: EscPosKitchenTicketInput): Uint8Array {
  const {
    order,
    restaurantName,
    restaurant,
    payment,
    preparationMinutes = order.estimatedReadyMinutes ?? 15,
    lineWidth,
  } = input;

  const encoder = new EscPosEncoder({ lineWidth, sharpPrint: true });
  const width = lineWidth ?? 42;
  encoder.lineSpacing(KITCHEN_LINE_SPACING);

  const created = formatKitchenDateTime(order.createdAt);
  const paymentLabel =
    payment?.methodLabel ?? kitchenPaymentMethodLabel(order.paymentMethod);
  const paymentStatus = paymentStatusKitchenLabel(
    order.paymentStatus ?? PaymentStatus.PENDING
  );
  const readyClock = formatReadyClock(order.createdAt, preparationMinutes);
  const pickupWord =
    order.orderType === OrderType.DELIVERY ? "Levereras" : "Hämtas";
  const gross = order.total;
  const net = gross / (1 + VAT_RATE);
  const vat = gross - net;

  encoder.bold();
  encoder.columns(
    orderTypeKitchenLabel(order.orderType),
    created
  );
  encoder.bold(false);
  encoder.rule("-");

  encoder.line(order.customerName);
  encoder.columns(`Telefon: ${order.customerPhone}`, paymentStatus);
  encoder.columns("", paymentLabel);
  encoder.rule("-");

  if (order.customerAddress?.trim() && order.orderType === OrderType.DELIVERY) {
    encoder.line(order.customerAddress.trim());
    encoder.rule("-");
  }

  for (const item of order.items) {
    printProductBlock(encoder, width, order.orderNumber, item);
  }

  if (order.note?.trim()) {
    printOrderComment(encoder, order.note);
  }

  if (order.adminNote?.trim()) {
    encoder.bold().line("Intern notering:").bold(false);
    encoder.line(order.adminNote.trim());
  }

  encoder.rule("=");
  encoder.rule("=");
  encoder.bold().size("large");
  encoder.columns("TOTALT", formatKr(gross));
  encoder.size("normal").bold(false);
  encoder.columns(`Varav moms (${Math.round(VAT_RATE * 100)}%)`, formatKrDecimal(vat));

  encoder.blank();
  encoder.bold().line(
    `Status: ${STATUS_LABELS[order.status]}, ${preparationMinutes} min (${pickupWord} c:a ${readyClock})`
  );
  encoder.bold(false);

  const footerName = restaurant?.name ?? restaurantName;
  encoder.blank();
  encoder.line(footerName);
  if (restaurant?.address?.trim()) encoder.line(restaurant.address.trim());
  if (restaurant?.phone?.trim()) encoder.line(`Tel: ${restaurant.phone.trim()}`);
  if (restaurant?.vatNumber?.trim()) {
    encoder.line(`Org.nr: ${restaurant.vatNumber.trim()}`);
  }
  encoder.line(`Ordernr: ${order.orderNumber}`);
  if (payment?.swishReference?.trim()) {
    encoder.line(`swish: ${payment.swishReference.trim()}`);
  } else if (order.paymentMethod === PaymentMethod.SWISH) {
    encoder.line(`swish: ${order.orderNumber}`);
  }

  return encoder.encode();
}
