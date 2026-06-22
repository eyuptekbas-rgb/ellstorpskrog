import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { sendOrderNotification } from "@/lib/email/notify";
import { isEmailConfigured } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type SendBody = {
  orderId: string;
  type: NotificationType;
  recipient?: string;
  force?: boolean;
};

export async function POST(req: Request) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const tenantId = await getAdminTenantId();
    const body: SendBody = await req.json();
    const { orderId, type, recipient, force } = body;

    if (!orderId || !type || !Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "orderId and valid type are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await sendOrderNotification(order, type, {
      recipient,
      force: force ?? true,
    });

    return NextResponse.json(result);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("POST /api/notifications/send error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
