import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  buildSalesReport,
  getReportPeriod,
  reconcileCash,
  reportToCsv,
  reportToPdfBytes,
} from "@/lib/reports/sales-report";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET(req: Request) {
  try {
    await requirePermission("reports");
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const kind = (searchParams.get("kind") ?? "x") as "x" | "z" | "daily";
    const format = searchParams.get("format") ?? "json";
    const countedCash = Number(searchParams.get("countedCash") ?? "0");

    const report = await buildSalesReport(tenantId, kind);
    const reconciliation =
      countedCash > 0
        ? reconcileCash(report.cashExpected, countedCash)
        : null;

    if (format === "csv") {
      return new NextResponse(reportToCsv(report), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${kind}-report.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const bytes = await reportToPdfBytes(report);
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${kind}-report.pdf"`,
        },
      });
    }

    return NextResponse.json({
      report,
      reconciliation,
      period: getReportPeriod(kind),
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }
}
