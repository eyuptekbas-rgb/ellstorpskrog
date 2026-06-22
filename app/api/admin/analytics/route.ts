import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/admin/analytics";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenantId = await getAdminTenantId();
    const analytics = await getAnalyticsSnapshot(tenantId);
    return NextResponse.json(analytics, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta analys." },
      { status: 500 }
    );
  }
}
