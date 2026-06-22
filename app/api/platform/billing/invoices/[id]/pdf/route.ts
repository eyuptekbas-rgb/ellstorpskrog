import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import {
  getPlatformInvoiceWithDocument,
} from "@/lib/billing/service";
import {
  base64ToPdf,
  generatePlatformInvoicePdf,
  pdfToBase64,
} from "@/lib/billing/pdf";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const result = await getPlatformInvoiceWithDocument(id);

    if (!result) {
      return NextResponse.json({ error: "Faktura hittades inte" }, { status: 404 });
    }

    let pdfBytes: Uint8Array;
    if (result.invoice.pdfData) {
      pdfBytes = new Uint8Array(base64ToPdf(result.invoice.pdfData));
    } else {
      pdfBytes = await generatePlatformInvoicePdf(result.document);
    }

    const body = Buffer.from(pdfBytes);

    return new NextResponse(body as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const result = await getPlatformInvoiceWithDocument(id);

    if (!result) {
      return NextResponse.json({ error: "Faktura hittades inte" }, { status: 404 });
    }

    const pdfBytes = await generatePlatformInvoicePdf(result.document);
    const pdfData = pdfToBase64(pdfBytes);

    return NextResponse.json({ pdfData });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
