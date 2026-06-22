import { NextResponse } from "next/server";
import { getEconomyStats, type EconomyPeriod } from "@/lib/economy/stats";
import { buildInvoiceData } from "@/lib/economy/invoice";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";
import { prisma } from "@/lib/prisma";
import { ensureSiteSettings } from "@/lib/settings";

const PERIODS: EconomyPeriod[] = ["today", "week", "month", "all"];

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get("period") ?? "month";
    const period = PERIODS.includes(periodParam as EconomyPeriod)
      ? (periodParam as EconomyPeriod)
      : "month";
    const invoiceId = searchParams.get("invoiceId");

    if (invoiceId) {
      const [order, settings] = await Promise.all([
        prisma.order.findFirst({
          where: { id: invoiceId, tenantId },
          include: { items: { orderBy: { productName: "asc" } } },
        }),
        ensureSiteSettings(tenantId),
      ]);

      if (!order) {
        return NextResponse.json({ error: "Faktura hittades inte" }, { status: 404 });
      }

      return NextResponse.json({
        invoice: buildInvoiceData(order, settings),
      });
    }

    const stats = await getEconomyStats(tenantId, period);
    return NextResponse.json(stats);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/admin/economy error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta ekonomidata" },
      { status: 500 }
    );
  }
}
