import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { sendOrderNotification } from "@/lib/email/notify";
import { isEmailConfigured } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

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

    const body: SendBody = await req.json();
    const { orderId, type, recipient, force } = body;

    if (!orderId || !type || !Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "orderId and valid type are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
    console.error("POST /api/notifications/send error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
