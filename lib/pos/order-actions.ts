import { OrderStatus, OrderType } from "@prisma/client";
import { getOrderActions } from "@/lib/orders/admin-filters";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";

export type PosStatusAction = {
  label: string;
  status: OrderStatus;
};

/** Primary POS action for kitchen / pickup / delivery workflow. */
export function getPosStatusAction(
  order: AdminOrderListItem
): PosStatusAction | null {
  if (
    order.status === OrderStatus.CONFIRMED ||
    order.status === OrderStatus.PREPARING
  ) {
    return { label: "Klar", status: OrderStatus.READY };
  }

  const actions = getOrderActions(order.status, order.orderType);
  const primary = actions.find((action) => action.tone === "primary");
  if (!primary) return null;

  const labels: Record<string, string> = {
    preparing: "Tillagas",
    ready: "Klar",
    "picked-up": "Hämtad",
    delivering: "Under leverans",
    delivered: "Levererad",
  };

  return {
    label: labels[primary.key] ?? primary.label,
    status: primary.status,
  };
}

export function isPosNewOrder(order: AdminOrderListItem): boolean {
  return order.status === OrderStatus.NEW;
}

export function isPosCompletedOrder(order: AdminOrderListItem): boolean {
  return order.status === OrderStatus.COMPLETED;
}

export function isPosDeliveryReady(order: AdminOrderListItem): boolean {
  return (
    order.status === OrderStatus.READY &&
    order.orderType === OrderType.DELIVERY
  );
}
