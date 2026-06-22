import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  SiteSettings,
} from "@prisma/client";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  formatOrderDate,
  formatOrderNumber,
} from "@/lib/orders";
import { parseOrderItemDisplay } from "@/lib/cart";

export type InvoiceLine = {
  name: string;
  options: string[];
  note: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  orderId: string;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string | null;
  };
  orderType: OrderType;
  orderTypeLabel: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  orderStatus: OrderStatus;
  orderStatusLabel: string;
  orderNote: string | null;
  lines: InvoiceLine[];
  subtotal: number;
  total: number;
  currency: "SEK";
  vatNote: string;
};

export function buildInvoiceData(
  order: Order & { items: OrderItem[] },
  settings: SiteSettings
): InvoiceData {
  const lines: InvoiceLine[] = order.items.map((item) => {
    const parsed = parseOrderItemDisplay(item.productName);
    return {
      name: parsed.name,
      options: parsed.options,
      note: parsed.note,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.totalPrice, 0);

  return {
    invoiceNumber: formatOrderNumber(order.orderNumber),
    invoiceDate: formatOrderDate(order.createdAt),
    orderId: order.id,
    restaurant: {
      name: settings.restaurantName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
    },
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.customerAddress,
    },
    orderType: order.orderType,
    orderTypeLabel: ORDER_TYPE_LABELS[order.orderType],
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: PAYMENT_LABELS[order.paymentMethod],
    paymentStatus: order.paymentStatus,
    paymentStatusLabel: PAYMENT_STATUS_LABELS[order.paymentStatus],
    orderStatus: order.status,
    orderStatusLabel: STATUS_LABELS[order.status],
    orderNote: order.note,
    lines,
    subtotal,
    total: order.total,
    currency: "SEK",
    vatNote: "Alla priser inkluderar moms.",
  };
}

export function formatSek(amount: number): string {
  return `${amount.toLocaleString("sv-SE")} kr`;
}
