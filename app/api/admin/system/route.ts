import { NextResponse } from "next/server";
import { getSystemStatus } from "@/lib/system/status";
import { logError } from "@/lib/logging/production-logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getSystemStatus();
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    logError("System status check failed", { context: "api/admin/system", error });
    return NextResponse.json(
      { error: "Failed to load system status" },
      { status: 500 }
    );
  }
}
