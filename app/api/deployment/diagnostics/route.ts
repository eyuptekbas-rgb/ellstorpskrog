import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { runDeploymentDiagnostics } from "@/lib/deployment/diagnostics";
import { tenantApiError } from "@/lib/tenant/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("settings");
    const diagnostics = await runDeploymentDiagnostics();
    return NextResponse.json(diagnostics, {
      status: diagnostics.ready ? 200 : 503,
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json(
      { error: "Failed to run diagnostics" },
      { status: 500 }
    );
  }
}
