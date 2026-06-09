import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@prisma/client";

export const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

/** Admin list filter pills — "DELIVERED" groups DELIVERING + COMPLETED */
export type AdminOrderFilter = OrderStatus | "ALL" | "DELIVERED";

export const ADMIN_ORDER_FILTERS: { key: AdminOrderFilter; label: string }[] = [
  { key: "ALL", label: "Alla" },
  { key: OrderStatus.NEW, label: "Nya" },
  { key: OrderStatus.CONFIRMED, label: "Bekräftade" },
  { key: OrderStatus.PREPARING, label: "Tillagas" },
  { key: OrderStatus.READY, label: "Klara" },
  { key: "DELIVERED", label: "Levererade" },
  { key: OrderStatus.CANCELLED, label: "Avbrutna" },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Ny",
  CONFIRMED: "Bekräftad",
  PREPARING: "Tillagas",
  READY: "Klar",
  DELIVERING: "Under leverans",
  COMPLETED: "Levererad",
  CANCELLED: "Avbruten",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  PICKUP: "Avhämtning",
  DELIVERY: "Leverans",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CARD: "Kort (Stripe)",
  ON_PICKUP: "Betal vid avhämtning",
  ON_DELIVERY: "Betal vid leverans",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Obetald",
  PAID: "Betald",
  FAILED: "Misslyckad",
  REFUNDED: "Återbetald",
};

export function paymentStatusStyle(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PAID:
      return "text-green-400 bg-green-400/10";
    case PaymentStatus.PENDING:
      return "text-yellow-400 bg-yellow-400/10";
    case PaymentStatus.FAILED:
      return "text-red-400 bg-red-400/10";
    case PaymentStatus.REFUNDED:
      return "text-purple-400 bg-purple-400/10";
    default:
      return "text-white/60 bg-white/10";
  }
}

export function statusStyle(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.NEW:
      return "text-yellow-400 bg-yellow-400/10";
    case OrderStatus.CONFIRMED:
      return "text-blue-400 bg-blue-400/10";
    case OrderStatus.PREPARING:
      return "text-orange-400 bg-orange-400/10";
    case OrderStatus.READY:
      return "text-cyan-400 bg-cyan-400/10";
    case OrderStatus.DELIVERING:
      return "text-purple-400 bg-purple-400/10";
    case OrderStatus.COMPLETED:
      return "text-green-400 bg-green-400/10";
    case OrderStatus.CANCELLED:
      return "text-red-400 bg-red-400/10";
    default:
      return "text-white/60 bg-white/10";
  }
}

export function formatOrderDate(date: Date) {
  return date.toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function shortOrderId(id: string) {
  return id.slice(-8).toUpperCase();
}

export function formatOrderNumber(orderNumber: string) {
  return orderNumber;
}
