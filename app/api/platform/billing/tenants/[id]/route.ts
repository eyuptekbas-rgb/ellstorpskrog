import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import {
  getTenantInvoiceHistory,
  updateTenantBilling,
} from "@/lib/billing/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const history = await getTenantInvoiceHistory(id);
    return NextResponse.json({ history });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load tenant billing" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await req.json();

    const tenant = await updateTenantBilling(id, {
      monthlySubscriptionFee: body.monthlySubscriptionFee,
      orderFee: body.orderFee,
      invoiceEmail: body.invoiceEmail,
      companyName: body.companyName,
      organizationNumber: body.organizationNumber,
      billingAddress: body.billingAddress,
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update billing settings" }, { status: 500 });
  }
}
