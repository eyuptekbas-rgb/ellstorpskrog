import { render } from "@react-email/render";
import { NotificationType } from "@prisma/client";
import OrderReceivedEmail from "@/emails/OrderReceived";
import PaymentReceivedEmail from "@/emails/PaymentReceived";
import OrderReadyEmail from "@/emails/OrderReady";
import OrderCompletedEmail from "@/emails/OrderCompleted";
import OrderCancelledEmail from "@/emails/OrderCancelled";
import RestaurantNewOrderEmail from "@/emails/RestaurantNewOrder";
import RestaurantPaymentReceivedEmail from "@/emails/RestaurantPaymentReceived";
import RestaurantOrderCancelledEmail from "@/emails/RestaurantOrderCancelled";
import type { OrderEmailData } from "@/lib/email/types";
import { getAdminOrderUrl } from "@/lib/email/types";

export async function renderNotificationEmail(
  type: NotificationType,
  data: OrderEmailData
): Promise<string> {
  const adminOrderUrl = getAdminOrderUrl(data.order.id);

  switch (type) {
    case "CUSTOMER_ORDER_CONFIRMATION":
      return render(
        OrderReceivedEmail({
          order: data.order,
          restaurantName: data.restaurantName,
        })
      );
    case "CUSTOMER_PAYMENT_CONFIRMATION":
      return render(
        PaymentReceivedEmail({
          order: data.order,
          restaurantName: data.restaurantName,
        })
      );
    case "CUSTOMER_ORDER_READY":
      return render(
        OrderReadyEmail({
          order: data.order,
          restaurantName: data.restaurantName,
        })
      );
    case "CUSTOMER_ORDER_DELIVERED":
      return render(
        OrderCompletedEmail({
          order: data.order,
          restaurantName: data.restaurantName,
        })
      );
    case "CUSTOMER_ORDER_CANCELLED":
      return render(
        OrderCancelledEmail({
          order: data.order,
          restaurantName: data.restaurantName,
        })
      );
    case "RESTAURANT_NEW_ORDER":
      return render(
        RestaurantNewOrderEmail({
          order: data.order,
          restaurantName: data.restaurantName,
          adminOrderUrl,
        })
      );
    case "RESTAURANT_PAYMENT_RECEIVED":
      return render(
        RestaurantPaymentReceivedEmail({
          order: data.order,
          restaurantName: data.restaurantName,
          adminOrderUrl,
        })
      );
    case "RESTAURANT_ORDER_CANCELLED":
      return render(
        RestaurantOrderCancelledEmail({
          order: data.order,
          restaurantName: data.restaurantName,
          adminOrderUrl,
        })
      );
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}
