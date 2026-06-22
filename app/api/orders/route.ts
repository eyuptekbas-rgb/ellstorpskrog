import { NextResponse } from "next/server";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { notifyOrderCreated } from "@/lib/email/notify";
import {
  ORDER_TYPE_MAP,
  OFFLINE_PAYMENT_METHODS,
  PAYMENT_MAP,
  createOrder,
} from "@/lib/orders/create-order";
import { orderFilterToStatuses } from "@/lib/orders/admin-filters";
import type { OrderFilterGroup } from "@/lib/orders/admin-filters";
import {
  OrderPricingError,
  validateOrderPricing,
} from "@/lib/orders/validate-pricing";
import { prisma } from "@/lib/prisma";
import { publishNewOrder } from "@/lib/realtime/publish";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

type OrderItemInput = {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  selectedOptionIds?: string[];
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
  subtotal?: number;
  deliveryFee?: number;
  items: OrderItemInput[];
};

export async function POST(req: Request) {
  try {
    const tenantId = await resolvePublicTenantId();
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
      subtotal,
      deliveryFee,
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

    if (mappedPayment === PaymentMethod.ON_DELIVERY) {
      return NextResponse.json(
        { error: "Betalning vid leverans är inte tillgänglig. Betala online." },
        { status: 400 }
      );
    }

    if (!OFFLINE_PAYMENT_METHODS.includes(mappedPayment)) {
      return NextResponse.json(
        { error: "Use /api/payments/create for online payments" },
        { status: 400 }
      );
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
        paymentMethod: mappedPayment,
        paymentStatus: PaymentStatus.PENDING,
        note,
        total: pricing.total,
        items: pricing.items,
      })
    );

    publishNewOrder(tenantId, order.id, order.orderNumber);
    void notifyOrderCreated(order);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderPricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const group = searchParams.get("group") as OrderFilterGroup | null;

    let statusWhere = {};

    if (group && group !== "ALL") {
      const statuses = orderFilterToStatuses(group);
      if (statuses) {
        statusWhere = { status: { in: statuses } };
      }
    } else if (status === "DELIVERED") {
      statusWhere = {
        status: {
          in: [OrderStatus.DELIVERING, OrderStatus.COMPLETED],
        },
      };
    } else if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      statusWhere = { status: status as OrderStatus };
    }

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
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
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        customerAddress: true,
        orderType: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
        status: true,
        note: true,
        adminNote: true,
        estimatedReadyMinutes: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            productName: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
