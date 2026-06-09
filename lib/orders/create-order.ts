import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { generateOrderNumber } from "@/lib/orders/number";

export type OrderItemInput = {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  note?: string;
  total: number;
  items: OrderItemInput[];
  paymentStatus?: PaymentStatus;
  stripeSessionId?: string;
  paymentIntentId?: string;
};

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; statusHistory: true };
}>;

export async function createOrder(
  tx: Prisma.TransactionClient,
  input: CreateOrderInput
): Promise<OrderWithRelations> {
  const orderNumber = await generateOrderNumber(tx);

  const paymentStatus =
    input.paymentStatus ??
    (input.paymentMethod === PaymentMethod.CARD
      ? PaymentStatus.PENDING
      : PaymentStatus.PENDING);

  return tx.order.create({
    data: {
      orderNumber,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      customerAddress: input.customerAddress || null,
      orderType: input.orderType,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      stripeSessionId: input.stripeSessionId ?? null,
      paymentIntentId: input.paymentIntentId ?? null,
      note: input.note || null,
      total: input.total,
      status: OrderStatus.NEW,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId || null,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
      },
      statusHistory: {
        create: { status: OrderStatus.NEW },
      },
    },
    include: { items: true, statusHistory: true },
  });
}

export const ORDER_TYPE_MAP: Record<string, OrderType> = {
  afhentning: OrderType.PICKUP,
  pickup: OrderType.PICKUP,
  PICKUP: OrderType.PICKUP,
  levering: OrderType.DELIVERY,
  delivery: OrderType.DELIVERY,
  DELIVERY: OrderType.DELIVERY,
};

export const PAYMENT_MAP: Record<string, PaymentMethod> = {
  kort: PaymentMethod.CARD,
  card: PaymentMethod.CARD,
  CARD: PaymentMethod.CARD,
  afhentning: PaymentMethod.ON_PICKUP,
  on_pickup: PaymentMethod.ON_PICKUP,
  ON_PICKUP: PaymentMethod.ON_PICKUP,
  levering_betalning: PaymentMethod.ON_DELIVERY,
  on_delivery: PaymentMethod.ON_DELIVERY,
  ON_DELIVERY: PaymentMethod.ON_DELIVERY,
};
