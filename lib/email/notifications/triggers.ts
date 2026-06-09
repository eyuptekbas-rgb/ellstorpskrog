import { NotificationType, OrderStatus } from "@prisma/client";
import { sendNotification } from "@/lib/email/notifications/send";
import {
  buildOrderEmailData,
  getRestaurantNotificationEmail,
  type OrderWithItems,
} from "@/lib/email/types";
import { ensureSiteSettings } from "@/lib/settings";

async function sendToCustomer(
  order: OrderWithItems,
  type: NotificationType,
  settings: Awaited<ReturnType<typeof ensureSiteSettings>>
) {
  const data = buildOrderEmailData(order, settings);
  return sendNotification({
    type,
    to: order.customerEmail,
    data,
    orderId: order.id,
    settings,
  });
}

async function sendToRestaurant(
  order: OrderWithItems,
  type: NotificationType,
  settings: Awaited<ReturnType<typeof ensureSiteSettings>>
) {
  const data = buildOrderEmailData(order, settings);
  return sendNotification({
    type,
    to: getRestaurantNotificationEmail(settings),
    data,
    orderId: order.id,
    settings,
  });
}

/** Cash / pay-on-delivery orders — sent immediately on create */
export async function notifyOrderCreated(order: OrderWithItems): Promise<void> {
  try {
    const settings = await ensureSiteSettings();
    await Promise.all([
      sendToCustomer(order, NotificationType.CUSTOMER_ORDER_CONFIRMATION, settings),
      sendToRestaurant(order, NotificationType.RESTAURANT_NEW_ORDER, settings),
    ]);
  } catch (error) {
    console.error("notifyOrderCreated error:", error);
  }
}

/** Card payment completed via Stripe */
export async function notifyPaymentCompleted(order: OrderWithItems): Promise<void> {
  try {
    const settings = await ensureSiteSettings();
    await Promise.all([
      sendToCustomer(order, NotificationType.CUSTOMER_ORDER_CONFIRMATION, settings),
      sendToCustomer(order, NotificationType.CUSTOMER_PAYMENT_CONFIRMATION, settings),
      sendToRestaurant(order, NotificationType.RESTAURANT_NEW_ORDER, settings),
      sendToRestaurant(order, NotificationType.RESTAURANT_PAYMENT_RECEIVED, settings),
    ]);
  } catch (error) {
    console.error("notifyPaymentCompleted error:", error);
  }
}

/** Admin status change — milestone notifications only */
export async function notifyOrderStatusChanged(
  order: OrderWithItems,
  previousStatus: OrderStatus
): Promise<void> {
  if (order.status === previousStatus) return;

  try {
    const settings = await ensureSiteSettings();

    if (order.status === OrderStatus.READY) {
      await sendToCustomer(order, NotificationType.CUSTOMER_ORDER_READY, settings);
      return;
    }

    if (order.status === OrderStatus.COMPLETED) {
      await sendToCustomer(order, NotificationType.CUSTOMER_ORDER_DELIVERED, settings);
      return;
    }

    if (order.status === OrderStatus.CANCELLED) {
      await Promise.all([
        sendToCustomer(order, NotificationType.CUSTOMER_ORDER_CANCELLED, settings),
        sendToRestaurant(order, NotificationType.RESTAURANT_ORDER_CANCELLED, settings),
      ]);
    }
  } catch (error) {
    console.error("notifyOrderStatusChanged error:", error);
  }
}

/** Manual / test send from admin */
export async function sendOrderNotification(
  order: OrderWithItems,
  type: NotificationType,
  options?: { force?: boolean; recipient?: string }
) {
  const settings = await ensureSiteSettings();
  const data = buildOrderEmailData(order, settings);
  const isRestaurant = type.startsWith("RESTAURANT_");
  const to =
    options?.recipient ??
    (isRestaurant
      ? getRestaurantNotificationEmail(settings)
      : order.customerEmail);

  return sendNotification({
    type,
    to,
    data,
    orderId: order.id,
    settings,
    force: options?.force ?? true,
  });
}

/** @deprecated use notifyOrderCreated or notifyPaymentCompleted */
export async function notifyNewOrder(order: OrderWithItems): Promise<void> {
  return notifyOrderCreated(order);
}
