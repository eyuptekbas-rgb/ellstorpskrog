import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSystemStatus } from "@/lib/system/status";
import { collectHardwareDiagnostics } from "@/lib/system/hardware-diagnostics";
import { logError } from "@/lib/logging/production-logger";
import { tenantApiError } from "@/lib/tenant/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const authz = await requirePermission("settings");
    const [status, hardware] = await Promise.all([
      getSystemStatus(),
      collectHardwareDiagnostics(authz.tenantId),
    ]);

    return NextResponse.json(
      { ...status, hardware },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    logError("System status check failed", { context: "api/admin/system", error });
    return NextResponse.json(
      { error: "Failed to load system status" },
      { status: 500 }
    );
  }
}
