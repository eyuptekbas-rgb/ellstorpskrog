import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { queryPrinterStatus } from "@/lib/printing/escpos/status";
import { tenantApiError } from "@/lib/tenant/admin-api";

export async function POST(req: Request) {
  try {
    await requirePermission("settings");

    const body = (await req.json()) as {
      printers?: Array<{ id: string; name: string; host: string; port?: number }>;
    };

    const printers = body.printers ?? [];
    const statuses = await Promise.all(
      printers.map(async (printer) => {
        const status = await queryPrinterStatus({
          host: printer.host,
          port: printer.port ?? 9100,
        });
        return {
          id: printer.id,
          name: printer.name,
          host: printer.host,
          port: printer.port ?? 9100,
          online: status.online,
          paperOut: status.paperOut,
          coverOpen: status.coverOpen,
          busy: status.busy,
          printerState: status.state,
          error: status.error,
        };
      })
    );

    return NextResponse.json({ statuses });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
