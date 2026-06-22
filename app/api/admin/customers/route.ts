import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/customers/crm-service";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || undefined;
    const result = await listCustomers(tenantId, search);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta kunder." },
      { status: 500 }
    );
  }
}
