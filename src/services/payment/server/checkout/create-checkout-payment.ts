import { PaymentStatus, PaymentMethod, OrderStatus } from "@prisma/client";
import { ORDER_TYPE_MAP, createOrder } from "@/lib/orders/create-order";
import { validateOrderPricing } from "@/lib/orders/validate-pricing";
import { getStripeConfig } from "@/lib/stripe/config";
import { prisma } from "@/lib/prisma";
import { paymentService, PaymentError } from "@/src/services/payment/server/payment-service";
import { orderTotalToPaymentAmount } from "@/src/services/payment/providers/stripe/amounts";
import { PAYMENT_METHODS } from "@/src/services/payment/types";

export type CreateCheckoutPaymentBody = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  orderType: string;
  note?: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  paymentMethod?: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    price: number;
    selectedOptionIds?: string[];
  }[];
};

function mapCheckoutPaymentMethod(
  method?: string
): (typeof PAYMENT_METHODS)[number] {
  switch (method) {
    case "apple_pay":
    case "APPLE_PAY":
      return PaymentMethod.APPLE_PAY;
    case "google_pay":
    case "GOOGLE_PAY":
      return PaymentMethod.GOOGLE_PAY;
    default:
      return PaymentMethod.CARD;
  }
}

export async function createCheckoutPayment(
  tenantId: string,
  body: CreateCheckoutPaymentBody
) {
  const stripeConfig = await getStripeConfig(tenantId);
  if (!stripeConfig.enabled) {
    return {
      ok: false as const,
      status: 503,
      error: "Card payments are not enabled",
    };
  }

  const {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    orderType,
    note,
    total,
    subtotal,
    deliveryFee,
    items,
    paymentMethod,
  } = body;

  const mappedOrderType = ORDER_TYPE_MAP[orderType];
  if (
    !customerName ||
    !customerPhone ||
    !customerEmail ||
    !mappedOrderType ||
    !total ||
    !items?.length
  ) {
    return {
      ok: false as const,
      status: 400,
      error: "Missing required fields",
    };
  }

  const pricing = await validateOrderPricing({
    tenantId,
    orderType: mappedOrderType,
    items,
    customerAddress,
    clientTotal: total,
    clientSubtotal: subtotal,
    clientDeliveryFee: deliveryFee,
  });

  const order = await prisma.$transaction(async (tx) =>
    createOrder(tx, {
      tenantId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      orderType: mappedOrderType,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.PENDING,
      note,
      total: pricing.total,
      items: pricing.items,
    })
  );

  try {
    const paymentResult = await paymentService.createPayment({
      orderId: order.id,
      businessId: tenantId,
      method: mapCheckoutPaymentMethod(paymentMethod),
      amount: orderTotalToPaymentAmount(pricing.total),
      currency: "SEK",
    });

    if (!paymentResult.actionUrl) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });
      return {
        ok: false as const,
        status: 500,
        error: "Failed to create checkout session",
      };
    }

    return {
      ok: true as const,
      url: paymentResult.actionUrl,
      sessionId: paymentResult.payment.providerPaymentId,
      paymentId: paymentResult.payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  } catch (error) {
    await prisma.order
      .update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      })
      .catch(() => undefined);

    if (error instanceof PaymentError) {
      return {
        ok: false as const,
        status: 400,
        error: error.message,
      };
    }

    throw error;
  }
}
