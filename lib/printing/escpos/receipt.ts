import { parseOrderItemDisplay } from "@/lib/cart";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  formatOrderNumber,
} from "@/lib/orders";
import type { PrintableOrder } from "../types";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { EscPosEncoder } from "./encoder";

export type EscPosRestaurantInfo = {
  name: string;
  address?: string;
  phone?: string;
  vatNumber?: string;
  thankYouMessage?: string;
};

export type EscPosPaymentInfo = {
  methodLabel: string;
  swishReference?: string | null;
  cardReference?: string | null;
};

export type EscPosVatLine = {
  label: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
};

export type EscPosReceiptInput = {
  order: PrintableOrder;
  restaurant: EscPosRestaurantInfo;
  payment?: EscPosPaymentInfo | null;
  cashier?: string;
  tableLabel?: string;
  discountTotal?: number;
  vatLines?: EscPosVatLine[];
  qrContent?: string;
  lineWidth?: number;
  vatRate?: 6 | 12;
};

const RECEIPT_LINE_WIDTH = 42;

function isConfirmedSwish(order: PrintableOrder): boolean {
  return order.paymentMethod === PaymentMethod.SWISH &&
    order.paymentStatus === PaymentStatus.PAID && order.swishConfirmed === true;
}

function formatKr(amount: number): string {
  return `${amount.toFixed(0)} kr`;
}

export function vatLinesForInclusiveTotal(
  total: number,
  vatRate: 6 | 12,
  discount = 0
): EscPosVatLine[] {
  const gross = Math.max(0, total - discount);
  const rate = vatRate / 100;
  const net = gross / (1 + rate);
  const vat = gross - net;
  return [
    {
      label: `${vatRate}% moms`,
      netAmount: net,
      vatAmount: vat,
      grossAmount: gross,
    },
  ];
}

export function formatEstimatedReadyTime(order: PrintableOrder): string | null {
  if (!order.confirmedAt || !order.estimatedReadyMinutes) return null;
  const acceptedAt = new Date(order.confirmedAt);
  if (Number.isNaN(acceptedAt.getTime()) || order.estimatedReadyMinutes <= 0) {
    return null;
  }
  const readyAt = new Date(
    acceptedAt.getTime() + order.estimatedReadyMinutes * 60_000
  );
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(readyAt);
}

function orderTypeLabel(order: PrintableOrder, tableLabel?: string): string {
  if (tableLabel?.trim()) return `Bord ${tableLabel.trim()}`;
  return ORDER_TYPE_LABELS[order.orderType] ?? order.orderType;
}

function wrapText(value: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let rest = value.trim();
  while (rest.length > 0) {
    if (rest.length <= maxWidth) {
      lines.push(rest);
      break;
    }
    let breakAt = rest.lastIndexOf(" ", maxWidth);
    if (breakAt <= 0) breakAt = maxWidth;
    lines.push(rest.slice(0, breakAt).trimEnd());
    rest = rest.slice(breakAt).trimStart();
  }
  return lines.length > 0 ? lines : [""];
}

function printCustomerField(
  encoder: EscPosEncoder,
  lineWidth: number,
  label: string,
  value: string
): void {
  const labelText = `${label}: `;
  const valueWidth = Math.max(1, lineWidth - labelText.length);
  const valueIndent = " ".repeat(labelText.length);
  const valueLines = wrapText(value, valueWidth);

  encoder.line(`${labelText}${valueLines[0] ?? ""}`);

  for (let i = 1; i < valueLines.length; i++) {
    encoder.line(`${valueIndent}${valueLines[i]}`);
  }
}

function printCustomerSection(
  encoder: EscPosEncoder,
  lineWidth: number,
  order: PrintableOrder
): void {
  const fields: { label: string; value: string }[] = [
    { label: "Namn", value: order.customerName?.trim() || "-" },
    { label: "Tlf nr", value: order.customerPhone?.trim() || "-" },
  ];
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    printCustomerField(encoder, lineWidth, field.label, field.value);
    if (index < fields.length - 1) encoder.blank();
  }
}

function printProductLine(
  encoder: EscPosEncoder,
  lineWidth: number,
  quantity: number,
  name: string,
  price: string
): void {
  const description = `${quantity}x ${name.trim()}`;
  const leftWidth = Math.max(1, lineWidth - price.length - 1);
  const descriptionLines = wrapText(description, leftWidth);

  for (let i = 0; i < descriptionLines.length - 1; i++) {
    encoder.line(descriptionLines[i]);
  }
  encoder.columns(descriptionLines.at(-1) ?? description, price);
}

function printAddonLine(
  encoder: EscPosEncoder,
  lineWidth: number,
  addon: string
): void {
  const prefix = "  + ";
  const lines = wrapText(addon, Math.max(1, lineWidth - prefix.length));
  encoder.line(`${prefix}${lines[0] ?? ""}`);
  for (let i = 1; i < lines.length; i++) {
    encoder.line(`${" ".repeat(prefix.length)}${lines[i]}`);
  }
}

function printOrderComment(encoder: EscPosEncoder, note: string): void {
  encoder.line("Meddelande");
  encoder.line(note.trim());
}

/** Encode a customer receipt as ESC/POS bytes. */
export function encodeReceipt(input: EscPosReceiptInput): Uint8Array {
  const {
    order,
    payment: suppliedPayment,
    tableLabel,
    discountTotal = 0,
    vatLines,
    vatRate = 12,
    lineWidth = RECEIPT_LINE_WIDTH,
  } = input;
  const claimsSwish = order.paymentMethod === PaymentMethod.SWISH ||
    /swish/i.test(suppliedPayment?.methodLabel ?? "") || Boolean(suppliedPayment?.swishReference);
  const payment = claimsSwish && !isConfirmedSwish(order) ? null : suppliedPayment;

  const encoder = new EscPosEncoder({ lineWidth, sharpPrint: true });
  const width = lineWidth;
  const vat =
    vatLines ?? vatLinesForInclusiveTotal(order.total, vatRate, discountTotal);
  const subtotal = Math.max(0, order.total - discountTotal);
  const vatTotal = vat.reduce((sum, row) => sum + row.vatAmount, 0);

  encoder.density(255, 1);
  encoder.fontA();
  // The installed 203 DPI printer has no fractional font scaling. Keep Font A
  // at its full 42-column width and use emphasized strokes for a darker,
  // clearer body without forcing every line into a wasteful 2x size.
  encoder.size("normal");
  encoder.bold();

  encoder.align("left");

  encoder.size("large").line(`Order nr: #${formatOrderNumber(order.orderNumber)}`).size("normal");
  encoder.line(orderTypeLabel(order, tableLabel));
  const readyTime = formatEstimatedReadyTime(order);
  if (readyTime) encoder.line(`Klar: ${readyTime}`);
  encoder.rule("-");
  encoder.blank();

  printCustomerSection(encoder, width, order);
  encoder.blank();
  encoder.rule("-");
  encoder.blank();

  encoder.size("large").line("PRODUKTER");
  encoder.blank();
  for (let itemIndex = 0; itemIndex < order.items.length; itemIndex++) {
    const item = order.items[itemIndex];
    const { name, options: extras, note } = parseOrderItemDisplay(item.productName);
    printProductLine(
      encoder,
      width,
      item.quantity,
      name,
      formatKr(item.totalPrice)
    );
    for (const extra of extras) {
      printAddonLine(encoder, width, extra);
    }
    if (note) {
      printAddonLine(encoder, width, note);
    }
    if (itemIndex < order.items.length - 1) {
      encoder.blank();
    }
  }

  if (order.note?.trim()) {
    encoder.blank();
    printOrderComment(encoder, order.note);
  }

  encoder.size("normal");

  if (discountTotal > 0) {
    encoder.blank();
    encoder.columns("Rabatt:", `-${formatKr(discountTotal)}`);
  }

  encoder.blank();
  encoder.rule("-");
  encoder.columns("Delsumma", formatKr(subtotal));
  encoder.blank();
  encoder.columns(`Moms (${vatRate}%)`, formatKr(vatTotal));
  if (payment) {
    encoder.blank();
    encoder.line(`Betalning: ${payment.methodLabel}`);
    if (payment.swishReference?.trim()) {
      encoder.line(`Swish: ${payment.swishReference.trim()}`);
    }
    if (payment.cardReference?.trim()) {
      encoder.line(`Kort: ${payment.cardReference.trim()}`);
    }
  }

  encoder.rule("=");
  encoder.size("large").columns("TOTALT", formatKr(subtotal)).size("normal");

  encoder.rule("-");
  encoder.bold(false);
  encoder.density(190, 2);

  return encoder.encode();
}

export function buildReceiptPaymentInfo(order: PrintableOrder): EscPosPaymentInfo {
  if (order.paymentMethod === PaymentMethod.SWISH && !isConfirmedSwish(order)) {
    return { methodLabel: "Ej bekräftad" };
  }
  const offlineDelivery = order.paymentMethod === PaymentMethod.ON_DELIVERY;

  return {
    methodLabel: offlineDelivery
      ? "Betald online"
      : PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod,
    swishReference:
      order.paymentMethod === "SWISH" ? order.orderNumber : null,
    cardReference:
      order.paymentMethod === "CARD" ||
      order.paymentMethod === "APPLE_PAY" ||
      order.paymentMethod === "GOOGLE_PAY"
        ? order.orderNumber
        : null,
  };
}

/** Customer receipts show only a completed, persisted online payment method. */
export function buildCustomerReceiptPaymentInfo(
  order: PrintableOrder
): EscPosPaymentInfo | null {
  if (order.paymentStatus !== PaymentStatus.PAID) return null;
  if (order.paymentMethod === PaymentMethod.SWISH && !isConfirmedSwish(order)) return null;

  const methodLabels: Partial<Record<PaymentMethod, string>> = {
    [PaymentMethod.CARD]: "Kort",
    [PaymentMethod.APPLE_PAY]: "Apple Pay",
    [PaymentMethod.GOOGLE_PAY]: "Google Pay",
    [PaymentMethod.SWISH]: "Swish",
    [PaymentMethod.MOBILEPAY]: "MobilePay",
  };
  const methodLabel = methodLabels[order.paymentMethod];
  if (!methodLabel) return null;

  return {
    methodLabel,
    swishReference: null,
    cardReference: null,
  };
}

export function buildDefaultRestaurantInfo(name: string): EscPosRestaurantInfo {
  return {
    name,
    thankYouMessage: "Tack för ditt besök!",
  };
}
