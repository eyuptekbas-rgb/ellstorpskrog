import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { upsertTerminalHeartbeat } from "@/lib/rms/terminal-store";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isStaffRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await getAdminTenantId();
    const body = (await req.json()) as {
      id?: string;
      name?: string;
      location?: string;
      kitchen?: string;
      deviceKind?: "pos" | "kitchen" | "customer-display" | "delivery";
      printerStatus?: "ok" | "degraded" | "error" | "unknown";
      printQueueLength?: number;
      offlineQueueLength?: number;
      appVersion?: string;
    };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Invalid terminal id" }, { status: 400 });
    }

    const terminal = upsertTerminalHeartbeat(tenantId, {
      id: body.id,
      name: typeof body.name === "string" ? body.name : "Terminal",
      location: typeof body.location === "string" ? body.location : "",
      kitchen: typeof body.kitchen === "string" ? body.kitchen : "",
      deviceKind: body.deviceKind,
      printerStatus: body.printerStatus,
      printQueueLength:
        typeof body.printQueueLength === "number" ? body.printQueueLength : undefined,
      offlineQueueLength:
        typeof body.offlineQueueLength === "number" ? body.offlineQueueLength : undefined,
      appVersion: typeof body.appVersion === "string" ? body.appVersion : undefined,
    });

    return NextResponse.json({ terminal });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json(
      { error: "Heartbeat failed" },
      { status: 500 }
    );
  }
}
