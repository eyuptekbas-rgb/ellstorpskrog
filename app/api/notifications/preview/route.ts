import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { renderNotificationEmail } from "@/lib/email/notifications/render";
import { buildSampleEmailData } from "@/lib/email/notifications/sample-data";
import { getNotificationSubject } from "@/lib/email/notifications/registry";
import { buildOrderEmailData } from "@/lib/email/types";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as NotificationType | null;
    const orderId = searchParams.get("orderId")?.trim();

    if (!type || !Object.values(NotificationType).includes(type)) {
      return NextResponse.json({ error: "Valid type is required" }, { status: 400 });
    }

    const settings = await ensureSiteSettings(tenantId);
    let data;

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        include: { items: true },
      });
      data = order
        ? buildOrderEmailData(order, settings)
        : buildSampleEmailData(settings);
    } else {
      data = buildSampleEmailData(settings);
    }

    const html = await renderNotificationEmail(type, data);

    const subject = getNotificationSubject(
      type,
      data.order.orderNumber,
      data.restaurantName
    );

    return NextResponse.json({ html, subject, type });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/notifications/preview error:", error);
    return NextResponse.json(
      { error: "Failed to render preview" },
      { status: 500 }
    );
  }
}
