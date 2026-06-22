import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { runDeploymentDiagnostics } from "@/lib/deployment/diagnostics";
import { collectRuntimeMetrics } from "@/lib/monitoring/metrics";
import { totalSseConnections } from "@/lib/realtime/bus";
import { tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  try {
    await requirePermission("settings");
    const diagnostics = await runDeploymentDiagnostics();
    const runtime = collectRuntimeMetrics({
      sseConnections: totalSseConnections(),
      printerStatus: "ok",
    });

    return NextResponse.json({ diagnostics, runtime });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Monitoring unavailable" }, { status: 500 });
  }
}
