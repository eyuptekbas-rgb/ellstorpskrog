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
  tenantId: string;
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
  const orderNumber = await generateOrderNumber(tx, input.tenantId);

  const paymentStatus = input.paymentStatus ?? PaymentStatus.PENDING;

  return tx.order.create({
    data: {
      tenantId: input.tenantId,
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
  afhentning: PaymentMethod.ON_PICKUP,
  kort: PaymentMethod.CARD,
  card: PaymentMethod.CARD,
  CARD: PaymentMethod.CARD,
  apple_pay: PaymentMethod.APPLE_PAY,
  APPLE_PAY: PaymentMethod.APPLE_PAY,
  google_pay: PaymentMethod.GOOGLE_PAY,
  GOOGLE_PAY: PaymentMethod.GOOGLE_PAY,
  swish: PaymentMethod.SWISH,
  SWISH: PaymentMethod.SWISH,
  mobilepay: PaymentMethod.MOBILEPAY,
  MOBILEPAY: PaymentMethod.MOBILEPAY,
};

export const OFFLINE_PAYMENT_METHODS: PaymentMethod[] =
  process.env.NODE_ENV === "production" ? [] : [PaymentMethod.ON_PICKUP];
