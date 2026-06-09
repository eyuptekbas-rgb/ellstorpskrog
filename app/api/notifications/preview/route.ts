import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { renderNotificationEmail } from "@/lib/email/notifications/render";
import { buildSampleEmailData } from "@/lib/email/notifications/sample-data";
import { getNotificationSubject } from "@/lib/email/notifications/registry";
import { buildOrderEmailData } from "@/lib/email/types";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as NotificationType | null;
    const orderId = searchParams.get("orderId")?.trim();

    if (!type || !Object.values(NotificationType).includes(type)) {
      return NextResponse.json({ error: "Valid type is required" }, { status: 400 });
    }

    const settings = await ensureSiteSettings();
    let data;

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
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
    console.error("GET /api/notifications/preview error:", error);
    return NextResponse.json(
      { error: "Failed to render preview" },
      { status: 500 }
    );
  }
}
