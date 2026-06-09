import type { NotificationType, SiteSettings } from "@prisma/client";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  CUSTOMER_ORDER_CONFIRMATION: "Order mottagen",
  CUSTOMER_PAYMENT_CONFIRMATION: "Betalning mottagen",
  CUSTOMER_ORDER_READY: "Order klar",
  CUSTOMER_ORDER_DELIVERED: "Order slutförd",
  CUSTOMER_ORDER_CANCELLED: "Order avbruten",
  RESTAURANT_NEW_ORDER: "Ny order",
  RESTAURANT_PAYMENT_RECEIVED: "Betalning mottagen",
  RESTAURANT_ORDER_CANCELLED: "Order avbruten",
};

export const CUSTOMER_NOTIFICATION_TYPES = [
  "CUSTOMER_ORDER_CONFIRMATION",
  "CUSTOMER_PAYMENT_CONFIRMATION",
  "CUSTOMER_ORDER_READY",
  "CUSTOMER_ORDER_DELIVERED",
  "CUSTOMER_ORDER_CANCELLED",
] as const satisfies readonly NotificationType[];

export const RESTAURANT_NOTIFICATION_TYPES = [
  "RESTAURANT_NEW_ORDER",
  "RESTAURANT_PAYMENT_RECEIVED",
  "RESTAURANT_ORDER_CANCELLED",
] as const satisfies readonly NotificationType[];

type SettingsKey =
  | "notifyCustomerOrderConfirmation"
  | "notifyCustomerPaymentConfirmation"
  | "notifyCustomerOrderReady"
  | "notifyCustomerOrderDelivered"
  | "notifyCustomerOrderCancelled"
  | "notifyRestaurantNewOrder"
  | "notifyRestaurantPaymentReceived"
  | "notifyRestaurantOrderCancelled";

export const NOTIFICATION_SETTINGS_KEY: Record<NotificationType, SettingsKey> = {
  CUSTOMER_ORDER_CONFIRMATION: "notifyCustomerOrderConfirmation",
  CUSTOMER_PAYMENT_CONFIRMATION: "notifyCustomerPaymentConfirmation",
  CUSTOMER_ORDER_READY: "notifyCustomerOrderReady",
  CUSTOMER_ORDER_DELIVERED: "notifyCustomerOrderDelivered",
  CUSTOMER_ORDER_CANCELLED: "notifyCustomerOrderCancelled",
  RESTAURANT_NEW_ORDER: "notifyRestaurantNewOrder",
  RESTAURANT_PAYMENT_RECEIVED: "notifyRestaurantPaymentReceived",
  RESTAURANT_ORDER_CANCELLED: "notifyRestaurantOrderCancelled",
};

export function isNotificationEnabled(
  type: NotificationType,
  settings: SiteSettings
): boolean {
  const isCustomer = type.startsWith("CUSTOMER_");
  const isRestaurant = type.startsWith("RESTAURANT_");

  if (isCustomer && !settings.customerEmailsEnabled) return false;
  if (isRestaurant && !settings.restaurantEmailsEnabled) return false;

  const key = NOTIFICATION_SETTINGS_KEY[type];
  return settings[key];
}

export function getNotificationSubject(
  type: NotificationType,
  orderNumber: string,
  restaurantName: string
): string {
  switch (type) {
    case "CUSTOMER_ORDER_CONFIRMATION":
      return `Orderbekräftelse ${orderNumber} — ${restaurantName}`;
    case "CUSTOMER_PAYMENT_CONFIRMATION":
      return `Betalningsbekräftelse ${orderNumber} — ${restaurantName}`;
    case "CUSTOMER_ORDER_READY":
      return `Din order ${orderNumber} är klar — ${restaurantName}`;
    case "CUSTOMER_ORDER_DELIVERED":
      return `Order slutförd ${orderNumber} — ${restaurantName}`;
    case "CUSTOMER_ORDER_CANCELLED":
      return `Order ${orderNumber} avbruten — ${restaurantName}`;
    case "RESTAURANT_NEW_ORDER":
      return `Ny beställning ${orderNumber} — ${restaurantName}`;
    case "RESTAURANT_PAYMENT_RECEIVED":
      return `Betalning mottagen ${orderNumber} — ${restaurantName}`;
    case "RESTAURANT_ORDER_CANCELLED":
      return `Order avbruten ${orderNumber} — ${restaurantName}`;
    default:
      return `Notifikation ${orderNumber}`;
  }
}
