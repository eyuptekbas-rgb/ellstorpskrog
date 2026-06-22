import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/admin/stats";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenantId = await getAdminTenantId();
    const stats = await getDashboardStats(tenantId);
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta dashboarddata" },
      { status: 500 }
    );
  }
}
