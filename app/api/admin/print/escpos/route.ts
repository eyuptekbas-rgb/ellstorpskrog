import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { sendEscPosToNetwork } from "@/lib/printing/escpos/connection";
import { isPrinterReady, queryPrinterStatus } from "@/lib/printing/escpos/status";
import { tenantApiError } from "@/lib/tenant/admin-api";
import { incrementMetric } from "@/lib/monitoring/metrics";

export async function POST(req: Request) {
  try {
    await requirePermission("settings");

    const body = (await req.json()) as {
      host?: string;
      port?: number;
      base64?: string;
      drawerOnly?: boolean;
      documentType?: string;
      skipStatusCheck?: boolean;
    };

    if (!body.host || !body.base64) {
      return NextResponse.json(
        { success: false, error: "host and base64 required" },
        { status: 400 }
      );
    }

    const port = typeof body.port === "number" ? body.port : 9100;
    const data = Uint8Array.from(atob(body.base64), (c) => c.charCodeAt(0));
    const config = { host: body.host, port };
    const skipStatus = body.skipStatusCheck !== false;

    if (!body.drawerOnly && !skipStatus) {
      const status = await queryPrinterStatus(config);
      if (!status.online) {
        return NextResponse.json({
          success: false,
          error: status.error ?? "Printer offline.",
          printerState: status.state,
        });
      }
      if (status.paperOut) {
        return NextResponse.json({
          success: false,
          error: "Printer paper out.",
          paperOut: true,
          printerState: "paper_out",
        });
      }
      if (status.coverOpen) {
        return NextResponse.json({
          success: false,
          error: "Printer cover open.",
          coverOpen: true,
          printerState: "cover_open",
        });
      }
      if (status.busy) {
        return NextResponse.json({
          success: false,
          error: "Printer busy.",
          busy: true,
          printerState: "busy",
        });
      }
    }

    const ready = body.drawerOnly ? true : await isPrinterReady(config);
    if (!ready && !skipStatus) {
      const status = await queryPrinterStatus(config);
      return NextResponse.json({
        success: false,
        error: status.error ?? "Printer not ready.",
        printerState: status.state,
        paperOut: status.paperOut,
        coverOpen: status.coverOpen,
        busy: status.busy,
      });
    }

    const result = await sendEscPosToNetwork(config, data);

    if (result.success) {
      incrementMetric("print.escpos.success");
    } else {
      incrementMetric("print.escpos.failed");
    }

    return NextResponse.json({
      ...result,
      printerState: result.success ? "online" : "error",
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json(
      { success: false, error: "Print request failed" },
      { status: 500 }
    );
  }
}
