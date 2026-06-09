import {
  NotificationDeliveryStatus,
  NotificationType,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  type SiteSettings,
} from "@prisma/client";
import type { OrderEmailData, OrderWithItems } from "@/lib/email/types";
import { buildOrderEmailData } from "@/lib/email/types";

export function buildSampleOrder(
  settings: SiteSettings,
  overrides?: Partial<{ customerEmail: string; customerName: string }>
): OrderWithItems {
  const now = new Date();
  return {
    id: "sample-order-id",
    orderNumber: "EK-TEST001",
    userId: null,
    customerName: overrides?.customerName ?? "Test Kund",
    customerPhone: "+46 70 123 45 67",
    customerEmail: overrides?.customerEmail ?? "test@example.com",
    customerAddress: "Testgatan 1, 211 45 Malmö",
    orderType: OrderType.DELIVERY,
    paymentMethod: PaymentMethod.CARD,
    paymentStatus: PaymentStatus.PAID,
    status: OrderStatus.CONFIRMED,
    note: "Testbeställning — inga allergier",
    total: 234,
    stripeSessionId: null,
    paymentIntentId: null,
    adminNote: null,
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: "sample-item-1",
        orderId: "sample-order-id",
        productId: null,
        productName: "Margherita",
        quantity: 1,
        unitPrice: 109,
        totalPrice: 109,
      },
      {
        id: "sample-item-2",
        orderId: "sample-order-id",
        productId: null,
        productName: "Coca-Cola 33 cl",
        quantity: 2,
        unitPrice: 25,
        totalPrice: 50,
      },
    ],
  };
}

export function buildSampleEmailData(
  settings: SiteSettings,
  overrides?: Partial<{ customerEmail: string; customerName: string }>
): OrderEmailData {
  return buildOrderEmailData(buildSampleOrder(settings, overrides), settings);
}

export const TEST_NOTIFICATION_TYPES: {
  type: NotificationType;
  label: string;
  description: string;
  audience: "customer" | "restaurant";
}[] = [
  {
    type: NotificationType.CUSTOMER_ORDER_CONFIRMATION,
    label: "Orderbekräftelse",
    description: "Skickas till kund när ordern mottagits",
    audience: "customer",
  },
  {
    type: NotificationType.RESTAURANT_NEW_ORDER,
    label: "Ny order (restaurang)",
    description: "Skickas till restaurangen vid ny beställning",
    audience: "restaurant",
  },
  {
    type: NotificationType.CUSTOMER_ORDER_READY,
    label: "Order klar",
    description: "Skickas när ordern är klar för avhämtning/leverans",
    audience: "customer",
  },
  {
    type: NotificationType.CUSTOMER_ORDER_DELIVERED,
    label: "Order slutförd",
    description: "Skickas när ordern är levererad/hämtad",
    audience: "customer",
  },
  {
    type: NotificationType.CUSTOMER_ORDER_CANCELLED,
    label: "Order avbruten",
    description: "Skickas till kund och restaurang vid avbokning",
    audience: "customer",
  },
];

export const DELIVERY_STATUS_LABELS: Record<NotificationDeliveryStatus, string> = {
  PENDING: "Väntar",
  SENT: "Skickad",
  FAILED: "Misslyckades",
  SKIPPED: "Överhoppad",
};
