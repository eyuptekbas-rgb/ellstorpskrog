import { NextResponse } from "next/server";
import { buildInvoiceData } from "@/lib/economy/invoice";
import { createInvoiceToken } from "@/lib/economy/invoice-token";
import { prisma } from "@/lib/prisma";
import { ensureSiteSettings } from "@/lib/settings";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderNumber = body.orderNumber?.toString().trim();
    const email = body.email?.toString().trim().toLowerCase();

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Ordernummer och e-post krävs." },
        { status: 400 }
      );
    }

    const tenantId = await resolvePublicTenantId();

    const order = await prisma.order.findFirst({
      where: {
        tenantId,
        orderNumber,
        customerEmail: { equals: email, mode: "insensitive" },
      },
      include: { items: { orderBy: { productName: "asc" } } },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ingen faktura hittades med dessa uppgifter." },
        { status: 404 }
      );
    }

    const settings = await ensureSiteSettings(tenantId);
    const invoice = buildInvoiceData(order, settings);
    const token = createInvoiceToken(order.id, order.customerEmail);

    return NextResponse.json({
      invoice,
      orderId: order.id,
      token,
    });
  } catch (error) {
    console.error("POST /api/faktura/lookup error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta fakturan." },
      { status: 500 }
    );
  }
}
