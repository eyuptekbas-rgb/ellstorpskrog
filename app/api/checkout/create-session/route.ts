import { NextResponse } from "next/server";
import {
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { ORDER_TYPE_MAP, createOrder } from "@/lib/orders/create-order";
import { getStripeConfig, getAppBaseUrl } from "@/lib/stripe/config";
import { getStripeClient } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma";

type CreateSessionBody = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  orderType: string;
  note?: string;
  total: number;
  deliveryFee?: number;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
};

export async function POST(req: Request) {
  try {
    const config = await getStripeConfig();
    if (!config.enabled) {
      return NextResponse.json(
        { error: "Card payments are not enabled" },
        { status: 503 }
      );
    }

    const body: CreateSessionBody = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      orderType,
      note,
      total,
      deliveryFee = 0,
      items,
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (mappedOrderType === OrderType.DELIVERY && !customerAddress?.trim()) {
      return NextResponse.json(
        { error: "Address is required for delivery" },
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
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.PENDING,
        note,
        total,
        items,
      })
    );

    const stripe = await getStripeClient();
    const baseUrl = getAppBaseUrl();

    const lineItems = [
      ...items.map((item) => ({
        price_data: {
          currency: "sek",
          product_data: { name: item.productName },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      ...(deliveryFee > 0
        ? [
            {
              price_data: {
                currency: "sek",
                product_data: { name: "Leveransavgift" },
                unit_amount: Math.round(deliveryFee * 100),
              },
              quantity: 1,
            },
          ]
        : []),
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      client_reference_id: order.id,
      line_items: lineItems,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?order_id=${order.id}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("POST /api/checkout/create-session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
