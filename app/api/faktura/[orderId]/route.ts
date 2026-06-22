import { NextResponse } from "next/server";
import { buildInvoiceData } from "@/lib/economy/invoice";
import { verifyInvoiceToken } from "@/lib/economy/invoice-token";
import { prisma } from "@/lib/prisma";
import { ensureSiteSettings } from "@/lib/settings";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const token = new URL(req.url).searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json({ error: "Ogiltig länk." }, { status: 400 });
    }

    const tenantId = await resolvePublicTenantId();

    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: { orderBy: { productName: "asc" } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Faktura hittades inte." }, { status: 404 });
    }

    if (!verifyInvoiceToken(order.id, order.customerEmail, token)) {
      return NextResponse.json({ error: "Ogiltig åtkomst." }, { status: 403 });
    }

    const settings = await ensureSiteSettings(tenantId);

    return NextResponse.json({
      invoice: buildInvoiceData(order, settings),
    });
  } catch (error) {
    console.error("GET /api/faktura/[orderId] error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta fakturan." },
      { status: 500 }
    );
  }
}
