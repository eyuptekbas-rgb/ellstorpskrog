import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";

export type PosQueueColumnKey = "new" | "kitchen" | "ready" | "completed";

export type PosQueueColumnOrders = Record<PosQueueColumnKey, AdminOrderListItem[]>;

export const POS_QUEUE_SECTIONS: {
  key: PosQueueColumnKey;
  label: string;
}[] = [
  { key: "new", label: "Nya" },
  { key: "kitchen", label: "Kök" },
  { key: "ready", label: "Klara" },
  { key: "completed", label: "Slutförda" },
];

/** Completed orders stay visible on POS for this long. */
export const POS_COMPLETED_VISIBLE_MS = 12 * 60 * 60 * 1000;

const KITCHEN_STATUSES = new Set<OrderStatus>([
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
]);

const READY_STATUSES = new Set<OrderStatus>([
  OrderStatus.READY,
  OrderStatus.DELIVERING,
]);

/** Paid online orders and unpaid pickup-at-counter orders are actionable on POS. */
export function isPosActionableOrder(order: AdminOrderListItem): boolean {
  if (order.paymentStatus === PaymentStatus.PAID) return true;
  return order.paymentMethod === PaymentMethod.ON_PICKUP;
}

export function isPosVisibleOrder(
  order: AdminOrderListItem,
  nowMs = Date.now()
): boolean {
  if (!isPosActionableOrder(order)) return false;
  if (order.status === OrderStatus.CANCELLED) return false;
  if (order.status === OrderStatus.COMPLETED) {
    return (
      nowMs - new Date(order.createdAt).getTime() <= POS_COMPLETED_VISIBLE_MS
    );
  }
  return (
    order.status === OrderStatus.NEW ||
    KITCHEN_STATUSES.has(order.status) ||
    READY_STATUSES.has(order.status)
  );
}

export function getPosQueueColumn(
  status: OrderStatus
): PosQueueColumnKey | null {
  if (status === OrderStatus.NEW) return "new";
  if (KITCHEN_STATUSES.has(status)) return "kitchen";
  if (READY_STATUSES.has(status)) return "ready";
  if (status === OrderStatus.COMPLETED) return "completed";
  return null;
}

export function sortQueueOrdersNewestFirst(
  orders: AdminOrderListItem[]
): AdminOrderListItem[] {
  return [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function partitionPosQueueOrders(
  orders: AdminOrderListItem[]
): PosQueueColumnOrders {
  const buckets: PosQueueColumnOrders = {
    new: [],
    kitchen: [],
    ready: [],
    completed: [],
  };

  for (const order of orders) {
    const column = getPosQueueColumn(order.status);
    if (column) buckets[column].push(order);
  }

  return {
    new: sortQueueOrdersNewestFirst(buckets.new),
    kitchen: sortQueueOrdersNewestFirst(buckets.kitchen),
    ready: sortQueueOrdersNewestFirst(buckets.ready),
    completed: sortQueueOrdersNewestFirst(buckets.completed),
  };
}

export function countPosQueueOrders(columns: PosQueueColumnOrders): number {
  return (
    columns.new.length +
    columns.kitchen.length +
    columns.ready.length +
    columns.completed.length
  );
}
