import { OrderStatus, OrderType } from "@prisma/client";

export type OrderFilterGroup =
  | "ALL"
  | "NEW"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "KITCHEN"
  | "READY"
  | "POS";

export const ORDER_FILTER_GROUPS: {
  key: OrderFilterGroup;
  label: string;
}[] = [
  { key: "ALL", label: "Alla" },
  { key: "NEW", label: "Nya" },
  { key: "ACTIVE", label: "Aktiva" },
  { key: "COMPLETED", label: "Klara" },
  { key: "CANCELLED", label: "Avbrutna" },
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
];

export function orderFilterToStatuses(
  filter: OrderFilterGroup
): OrderStatus[] | null {
  switch (filter) {
    case "NEW":
      return [OrderStatus.NEW];
    case "ACTIVE":
      return ACTIVE_ORDER_STATUSES;
    case "COMPLETED":
      return [OrderStatus.COMPLETED];
    case "CANCELLED":
      return [OrderStatus.CANCELLED];
    case "KITCHEN":
      return [
        OrderStatus.NEW,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.DELIVERING,
      ];
    case "READY":
      return [OrderStatus.READY, OrderStatus.DELIVERING];
    case "POS":
      return [
        OrderStatus.NEW,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.DELIVERING,
        OrderStatus.COMPLETED,
      ];
    default:
      return null;
  }
}

export type OrderAction = {
  key: string;
  label: string;
  status: OrderStatus;
  tone?: "primary" | "danger" | "neutral";
};

export function getOrderActions(
  status: OrderStatus,
  orderType: OrderType
): OrderAction[] {
  switch (status) {
    case OrderStatus.NEW:
      return [
        { key: "accept", label: "Acceptera", status: OrderStatus.CONFIRMED, tone: "primary" },
        { key: "reject", label: "Avvisa", status: OrderStatus.CANCELLED, tone: "danger" },
      ];
    case OrderStatus.CONFIRMED:
      return [
        { key: "preparing", label: "Tillagas", status: OrderStatus.PREPARING, tone: "primary" },
        { key: "reject", label: "Avbryt", status: OrderStatus.CANCELLED, tone: "danger" },
      ];
    case OrderStatus.PREPARING:
      return [
        { key: "ready", label: "Klar", status: OrderStatus.READY, tone: "primary" },
      ];
    case OrderStatus.READY:
      if (orderType === OrderType.DELIVERY) {
        return [
          { key: "delivering", label: "Under leverans", status: OrderStatus.DELIVERING, tone: "primary" },
        ];
      }
      return [
        { key: "picked-up", label: "Hämtad", status: OrderStatus.COMPLETED, tone: "primary" },
      ];
    case OrderStatus.DELIVERING:
      return [
        { key: "delivered", label: "Levererad", status: OrderStatus.COMPLETED, tone: "primary" },
      ];
    default:
      return [];
  }
}

export const POLL_INTERVAL_MS = 12_000;
/** Aggressive polling for POS terminals — runs alongside SSE. */
export const POS_POLL_INTERVAL_MS = 3_000;
