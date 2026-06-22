import { NextResponse } from "next/server";
import { NotificationDeliveryStatus, NotificationType } from "@prisma/client";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/email/notifications/registry";
import { prisma } from "@/lib/prisma";
import { orderTenantWhere } from "@/lib/tenant/scope";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId")?.trim();
    const type = searchParams.get("type") as NotificationType | null;
    const status = searchParams.get("status") as NotificationDeliveryStatus | null;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        select: { id: true },
      });
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    const logs = await prisma.notificationLog.findMany({
      where: {
        ...orderTenantWhere(tenantId),
        ...(orderId ? { orderId } : {}),
        ...(type && Object.values(NotificationType).includes(type) ? { type } : {}),
        ...(status &&
        Object.values(NotificationDeliveryStatus).includes(status)
          ? { status }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        order: { select: { orderNumber: true, customerName: true } },
      },
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        orderId: log.orderId,
        orderNumber: log.order?.orderNumber ?? null,
        customerName: log.order?.customerName ?? null,
        type: log.type,
        typeLabel: NOTIFICATION_TYPE_LABELS[log.type],
        recipient: log.recipient,
        subject: log.subject,
        status: log.status,
        errorMessage: log.errorMessage,
        resendId: log.resendId,
        retryCount: log.retryCount,
        sentAt: log.sentAt?.toISOString() ?? null,
        createdAt: log.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/notifications/logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification logs" },
      { status: 500 }
    );
  }
}
