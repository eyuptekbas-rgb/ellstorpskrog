import { parseOrderItemDisplay } from "@/lib/cart";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  formatOrderDate,
  formatOrderNumber,
} from "@/lib/orders";
import type { PrintableOrder } from "../types";
import { PaymentMethod } from "@prisma/client";
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
  payment: EscPosPaymentInfo;
  cashier?: string;
  tableLabel?: string;
  discountTotal?: number;
  vatLines?: EscPosVatLine[];
  qrContent?: string;
  lineWidth?: number;
};

const CUSTOMER_LABEL_WIDTH = 11;
const PRODUCT_MIN_DOTS = 2;

function formatKr(amount: number): string {
  return `${amount.toFixed(0)} kr`;
}

function defaultVatLines(total: number, discount = 0): EscPosVatLine[] {
  const gross = Math.max(0, total - discount);
  const rate = 0.12;
  const net = gross / (1 + rate);
  const vat = gross - net;
  return [
    {
      label: "12% moms",
      netAmount: net,
      vatAmount: vat,
      grossAmount: gross,
    },
  ];
}

function orderTypeLabel(order: PrintableOrder, tableLabel?: string): string {
  if (tableLabel?.trim()) return `Bord ${tableLabel.trim()}`;
  return ORDER_TYPE_LABELS[order.orderType] ?? order.orderType;
}

function dottedRule(encoder: EscPosEncoder, lineWidth: number): void {
  encoder.line(".".repeat(lineWidth));
}

function formatCustomerLabel(label: string): string {
  return `${label}:`.padEnd(CUSTOMER_LABEL_WIDTH);
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
  value: string,
  tightAfter: boolean
): void {
  const labelText = formatCustomerLabel(label);
  const valueWidth = lineWidth - labelText.length;
  const valueIndent = " ".repeat(labelText.length);
  const valueLines = wrapText(value, valueWidth);

  if (tightAfter) {
    encoder.lineFeedDots(`${labelText}${valueLines[0] ?? ""}`, 16);
  } else {
    encoder.line(`${labelText}${valueLines[0] ?? ""}`);
  }

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
    { label: "Namn", value: order.customerName },
    { label: "Tlf nr", value: order.customerPhone },
  ];
  if (order.customerEmail?.trim()) {
    fields.push({ label: "E-post", value: order.customerEmail.trim() });
  }
  if (order.customerAddress?.trim()) {
    fields.push({ label: "Adress", value: order.customerAddress.trim() });
  }

  encoder.line("KUND");
  for (let i = 0; i < fields.length; i++) {
    printCustomerField(
      encoder,
      lineWidth,
      fields[i].label,
      fields[i].value,
      i < fields.length - 1
    );
  }
}

function printProductLine(
  encoder: EscPosEncoder,
  lineWidth: number,
  quantity: number,
  name: string,
  price: string
): void {
  const prefix = `${quantity}x `;
  const maxNameLen = Math.max(
    1,
    lineWidth - price.length - PRODUCT_MIN_DOTS - prefix.length
  );
  const trimmedName =
    name.length > maxNameLen ? `${name.slice(0, maxNameLen - 1)}…` : name;
  const left = `${prefix}${trimmedName}`;
  const dots = ".".repeat(
    Math.max(PRODUCT_MIN_DOTS, lineWidth - left.length - price.length)
  );
  encoder.line(`${left}${dots}${price}`);
}

function printOrderComment(encoder: EscPosEncoder, note: string): void {
  encoder.line("Meddelande");
  encoder.line(note.trim());
}

/** Encode a customer receipt as ESC/POS bytes. */
export function encodeReceipt(input: EscPosReceiptInput): Uint8Array {
  const {
    order,
    restaurant,
    payment,
    cashier,
    tableLabel,
    discountTotal = 0,
    vatLines,
    lineWidth,
  } = input;

  const encoder = new EscPosEncoder({ lineWidth, sharpPrint: true });
  const width = lineWidth ?? 42;
  const created = formatOrderDate(new Date(order.createdAt));
  const vat = vatLines ?? defaultVatLines(order.total, discountTotal);

  encoder.density(255, 1);
  encoder.fontA();
  encoder.bold();

  encoder.align("center");
  encoder.size("large").line(restaurant.name).size("normal");
  encoder.align("left");
  encoder.blank();

  encoder.columns("Ordernummer:", formatOrderNumber(order.orderNumber));
  encoder.columns("Datum:", created);
  encoder.columns("Typ:", orderTypeLabel(order, tableLabel));
  if (cashier?.trim()) encoder.columns("Kassa:", cashier.trim());
  dottedRule(encoder, width);

  printCustomerSection(encoder, width, order);
  dottedRule(encoder, width);

  encoder.size("large").line("ARTIKLAR");
  encoder.lineSpacing(36);
  for (const item of order.items) {
    const { name, options: extras, note } = parseOrderItemDisplay(item.productName);
    printProductLine(
      encoder,
      width,
      item.quantity,
      name,
      formatKr(item.totalPrice)
    );
    if (extras.length > 0) {
      encoder.line(`  + ${extras.join(", ")}`);
    }
    if (note) {
      encoder.line(`  ${note}`);
    }
  }
  encoder.size("normal");
  encoder.lineSpacing(32);

  if (order.note?.trim()) {
    encoder.blank();
    printOrderComment(encoder, order.note);
  }

  if (discountTotal > 0) {
    encoder.blank();
    encoder.columns("Rabatt:", `-${formatKr(discountTotal)}`);
  }

  encoder.blank();
  encoder.rule("=");
  encoder.columns("Total:", formatKr(order.total));
  encoder.rule("=");

  encoder.blank();
  encoder.line("MOMS");
  for (const row of vat) {
    encoder.columns(row.label, formatKr(row.vatAmount));
    encoder.columns("Netto", formatKr(row.netAmount));
    encoder.columns("Brutto", formatKr(row.grossAmount));
  }

  encoder.blank();
  encoder.rule("-");
  encoder.line("BETALNING");
  encoder.line(payment.methodLabel);
  if (payment.swishReference?.trim()) {
    encoder.line(`Swish: ${payment.swishReference.trim()}`);
  }
  if (payment.cardReference?.trim()) {
    encoder.line(`Kort: ${payment.cardReference.trim()}`);
  }

  encoder.bold(false);
  encoder.density(190, 2);

  return encoder.encode();
}

export function buildReceiptPaymentInfo(order: PrintableOrder): EscPosPaymentInfo {
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

export function buildDefaultRestaurantInfo(name: string): EscPosRestaurantInfo {
  return {
    name,
    thankYouMessage: "Tack för ditt besök!",
  };
}
