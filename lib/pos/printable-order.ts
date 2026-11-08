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
    paymentStatus: order.paymentMethod === "SWISH" && order.swishConfirmed !== true &&
      order.paymentStatus === "PAID" ? "PENDING" : order.paymentStatus,
    swishConfirmed: order.swishConfirmed === true,
    note: order.note,
    adminNote: order.adminNote,
    total: order.total,
    status: order.status,
    estimatedReadyMinutes: order.estimatedReadyMinutes,
    confirmedAt: order.confirmedAt,
    createdAt: order.createdAt,
    items: order.items,
  };
}
