import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { cancelPlatformInvoice } from "@/lib/billing/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const invoice = await cancelPlatformInvoice(id);
    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "INVOICE_NOT_FOUND") {
        return NextResponse.json({ error: "Faktura hittades inte" }, { status: 404 });
      }
      if (error.message === "INVOICE_ALREADY_PAID") {
        return NextResponse.json(
          { error: "Betald faktura kan inte makuleras" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ error: "Failed to cancel invoice" }, { status: 500 });
  }
}
