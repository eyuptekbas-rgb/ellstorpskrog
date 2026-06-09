import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/health/checks";
import { logError } from "@/lib/logging/production-logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await runHealthChecks();
    const httpStatus =
      result.status === "healthy"
        ? 200
        : result.status === "degraded"
          ? 200
          : 503;

    return NextResponse.json(result, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    logError("Health check failed", { context: "api/health", error });
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        message: "Health check execution failed",
      },
      { status: 503 }
    );
  }
}
