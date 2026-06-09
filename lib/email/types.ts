import type { Order, OrderItem, OrderStatus, SiteSettings } from "@prisma/client";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  STATUS_LABELS,
} from "@/lib/orders";
import { absoluteUrl } from "@/lib/seo/url";

export type OrderWithItems = Order & { items: OrderItem[] };

export type OrderEmailPayload = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string | null;
  orderType: Order["orderType"];
  orderTypeLabel: string;
  paymentLabel: string;
  note: string | null;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  restaurantPhone: string;
  restaurantEmail: string;
};

export type OrderEmailData = {
  order: OrderEmailPayload;
  restaurantName: string;
};

export function buildOrderEmailData(
  order: OrderWithItems,
  settings: SiteSettings
): OrderEmailData {
  return {
    restaurantName: settings.restaurantName,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      orderType: order.orderType,
      orderTypeLabel: ORDER_TYPE_LABELS[order.orderType],
      paymentLabel: PAYMENT_LABELS[order.paymentMethod],
      note: order.note,
      total: order.total,
      status: order.status,
      items: order.items,
      restaurantPhone: settings.phone,
      restaurantEmail: settings.email,
    },
  };
}

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

export function getAdminOrderUrl(orderId: string): string {
  return absoluteUrl(`/admin/orders/${orderId}`);
}

export function getRestaurantNotificationEmail(settings: SiteSettings): string {
  return settings.notificationEmail?.trim() || settings.email;
}
