import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { listTerminals } from "@/lib/rms/terminal-store";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  try {
    await requirePermission("settings");
    const tenantId = await getAdminTenantId();
    return NextResponse.json({ terminals: listTerminals(tenantId) });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Kunde inte hämta terminaler." },
      { status: 500 }
    );
  }
}
