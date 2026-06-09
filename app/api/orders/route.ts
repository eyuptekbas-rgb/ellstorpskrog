import { NextResponse } from "next/server";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { notifyOrderCreated } from "@/lib/email/notify";
import {
  ORDER_TYPE_MAP,
  PAYMENT_MAP,
  createOrder,
} from "@/lib/orders/create-order";
import { prisma } from "@/lib/prisma";

type OrderItemInput = {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
};

type CreateOrderBody = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  orderType: string;
  paymentMethod: string;
  note?: string;
  total: number;
  items: OrderItemInput[];
};

export async function POST(req: Request) {
  try {
    const body: CreateOrderBody = await req.json();

    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      orderType,
      paymentMethod,
      note,
      total,
      items,
    } = body;

    const mappedOrderType = ORDER_TYPE_MAP[orderType];
    const mappedPayment = PAYMENT_MAP[paymentMethod];

    if (
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !mappedOrderType ||
      !mappedPayment ||
      !total ||
      !items?.length
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (mappedPayment === PaymentMethod.CARD) {
      return NextResponse.json(
        { error: "Use /api/checkout/create-session for card payments" },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) =>
      createOrder(tx, {
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        orderType: mappedOrderType,
        paymentMethod: mappedPayment,
        paymentStatus: PaymentStatus.PENDING,
        note,
        total,
        items,
      })
    );

    void notifyOrderCreated(order);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");

    const statusWhere =
      status === "DELIVERED"
        ? {
            status: {
              in: [OrderStatus.DELIVERING, OrderStatus.COMPLETED],
            },
          }
        : status && Object.values(OrderStatus).includes(status as OrderStatus)
          ? { status: status as OrderStatus }
          : {};

    const orders = await prisma.order.findMany({
      where: {
        ...statusWhere,
        ...(search
          ? {
              OR: [
                { customerName: { contains: search, mode: "insensitive" } },
                { customerPhone: { contains: search, mode: "insensitive" } },
                { orderNumber: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { id: true, quantity: true, productName: true } },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
