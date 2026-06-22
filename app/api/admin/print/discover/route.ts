import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { pingPrinter } from "@/lib/printing/escpos/status";
import { tenantApiError } from "@/lib/tenant/admin-api";

export async function POST(req: Request) {
  try {
    await requirePermission("settings");

    const body = (await req.json()) as {
      hosts?: string[];
      port?: number;
    };

    const hosts = Array.isArray(body.hosts) ? body.hosts.slice(0, 32) : [];
    const port = typeof body.port === "number" ? body.port : 9100;

    const results = await Promise.all(
      hosts.map(async (host) => {
        const ping = await pingPrinter(host, port);
        return { host, port, reachable: ping.reachable, latencyMs: ping.latencyMs, error: ping.error };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}
