import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { confirmOrderWithWaitTime } from "@/lib/orders/confirm-with-wait-time";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const body = (await req.json()) as { minutes?: number };
    const minutes = body.minutes;

    if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
      return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });
    }

    const session = await auth();
    const result = await confirmOrderWithWaitTime(id, minutes, tenantId, {
      actorUserId: session?.user?.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(result.order);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;

    if (error instanceof Error) {
      if (error.message === "Invalid wait time") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Order is not in NEW status") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error("PUT /api/orders/[id]/wait-time error:", error);
    return NextResponse.json(
      { error: "Failed to confirm wait time" },
      { status: 500 }
    );
  }
}
