import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { sendPlatformInvoice } from "@/lib/billing/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const invoice = await sendPlatformInvoice(id);
    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "INVOICE_NOT_FOUND") {
        return NextResponse.json({ error: "Faktura hittades inte" }, { status: 404 });
      }
      if (error.message === "MISSING_INVOICE_EMAIL") {
        return NextResponse.json(
          { error: "Kunden saknar faktura-e-post" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 });
  }
}
