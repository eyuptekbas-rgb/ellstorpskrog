import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import type { PrintableOrder } from "@/lib/printing/types";

export function toPrintableOrder(order: AdminOrderListItem): PrintableOrder {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    note: order.note,
    adminNote: order.adminNote,
    total: order.total,
    status: order.status,
    estimatedReadyMinutes: order.estimatedReadyMinutes,
    createdAt: order.createdAt,
    items: order.items,
  };
}
