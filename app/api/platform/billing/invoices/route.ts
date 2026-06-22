import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { generatePlatformInvoice } from "@/lib/billing/service";
import { parsePeriodInput } from "@/lib/billing/period";

export async function POST(req: Request) {
  try {
    await requirePlatformAdmin();
    const body = await req.json();
    const tenantId = body.tenantId?.toString();

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    const period = parsePeriodInput(body.year, body.month) ?? undefined;
    const invoice = await generatePlatformInvoice({
      tenantId,
      period,
      regenerate: Boolean(body.regenerate),
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "TENANT_NOT_FOUND") {
        return NextResponse.json({ error: "Kunden hittades inte" }, { status: 404 });
      }
      if (error.message === "INVOICE_ALREADY_PAID") {
        return NextResponse.json(
          { error: "Fakturan är redan betald och kan inte genereras om" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
