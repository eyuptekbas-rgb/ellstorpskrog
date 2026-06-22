import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { publishRmsOperation } from "@/lib/realtime/publish-operation";
import { isRmsOperationType } from "@/lib/rms/operations";
import { tenantApiError } from "@/lib/tenant/admin-api";
import { getAllMetrics } from "@/lib/monitoring/metrics";

export async function POST(req: Request) {
  try {
    const authz = await requirePermission("settings");
    const body = (await req.json()) as { operation?: string };

    if (!body.operation || !isRmsOperationType(body.operation)) {
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }

    publishRmsOperation(authz.tenantId, body.operation, authz.userId);

    return NextResponse.json({
      success: true,
      operation: body.operation,
      message: `Operation ${body.operation} broadcast to terminals.`,
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requirePermission("settings");

    const logs = {
      exportedAt: new Date().toISOString(),
      metrics: getAllMetrics(),
      nodeEnv: process.env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
    };

    return new NextResponse(JSON.stringify(logs, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="rms-logs-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Log export failed" }, { status: 500 });
  }
}
