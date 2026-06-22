import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { getPlatformInvoiceWithDocument } from "@/lib/billing/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const result = await getPlatformInvoiceWithDocument(id);

    if (!result) {
      return NextResponse.json({ error: "Faktura hittades inte" }, { status: 404 });
    }

    return NextResponse.json({
      invoice: result.invoice,
      document: result.document,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}
