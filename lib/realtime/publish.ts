import { OrderStatus } from "@prisma/client";
import { publishToTenant } from "./bus";
import type { RealtimeEvent, RealtimeEventType } from "./types";

export function publishRealtimeEvent(
  tenantId: string,
  type: RealtimeEventType,
  payload?: Record<string, unknown>
) {
  const event: RealtimeEvent = {
    type,
    tenantId,
    payload,
    at: new Date().toISOString(),
  };
  publishToTenant(tenantId, event);
}

export function publishOrderUpdated(
  tenantId: string,
  orderId: string,
  status: OrderStatus,
  orderNumber?: string
) {
  publishRealtimeEvent(tenantId, "OrderUpdated", {
    orderId,
    status,
    orderNumber,
  });

  const kitchenStatuses: OrderStatus[] = [
    OrderStatus.NEW,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERING,
  ];
  if (kitchenStatuses.includes(status)) {
    publishRealtimeEvent(tenantId, "KitchenUpdated", {
      orderId,
      status,
      orderNumber,
    });
  }
}

export function publishNewOrder(
  tenantId: string,
  orderId: string,
  orderNumber?: string
) {
  publishRealtimeEvent(tenantId, "NewOrder", { orderId, orderNumber });
  publishRealtimeEvent(tenantId, "KitchenUpdated", { orderId, orderNumber });
}

export function publishTableUpdated(tenantId: string, tableId: string) {
  publishRealtimeEvent(tenantId, "TableUpdated", { tableId });
}

export function publishStaffUpdated(tenantId: string, userId: string) {
  publishRealtimeEvent(tenantId, "StaffUpdated", { userId });
}
