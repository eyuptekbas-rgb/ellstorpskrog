import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import {
  getBillingDashboardStats,
  getTenantBillingRows,
  refreshBillingState,
} from "@/lib/billing/service";
import {
  getCurrentBillingPeriod,
  parsePeriodInput,
} from "@/lib/billing/period";

export async function GET(req: Request) {
  try {
    await requirePlatformAdmin();

    await refreshBillingState();

    const { searchParams } = new URL(req.url);
    const period =
      parsePeriodInput(
        searchParams.get("year"),
        searchParams.get("month")
      ) ?? getCurrentBillingPeriod();

    const [stats, tenants] = await Promise.all([
      getBillingDashboardStats(period),
      getTenantBillingRows(period),
    ]);

    return NextResponse.json({ stats, tenants, period });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load billing data" }, { status: 500 });
  }
}
