import os from "node:os";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runHealthChecks } from "@/lib/health/checks";
import { collectRuntimeMetrics } from "@/lib/monitoring/metrics";
import { totalSseConnections } from "@/lib/realtime/bus";
import { listTerminals } from "@/lib/rms/terminal-store";
import { verifySwishIntegration } from "@/lib/payment/swish-verification";

export type HardwareDiagnostics = {
  timestamp: string;
  buildVersion: string;
  buildNumber: string;
  nodeEnv: string;
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    systemFreeMb: number;
    systemTotalMb: number;
  };
  database: {
    status: string;
    message?: string;
  };
  realtime: {
    sseConnections: number;
    status: "ok" | "degraded" | "offline";
  };
  terminals: {
    total: number;
    online: number;
    offline: number;
    pos: number;
    kitchen: number;
    customerDisplay: number;
    offlineTerminals: number;
  };
  printers: {
    status: "ok" | "degraded" | "unknown";
    note: string;
  };
  swish: ReturnType<typeof verifySwishIntegration>;
};

function getBuildInfo(): { version: string; buildNumber: string } {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8")
    ) as { version?: string };
    const version = pkg.version ?? "0.0.0";
    const buildNumber =
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.BUILD_ID ??
      version;
    return { version, buildNumber };
  } catch {
    return { version: "0.0.0", buildNumber: "local" };
  }
}

export async function collectHardwareDiagnostics(
  tenantId?: string
): Promise<HardwareDiagnostics> {
  const health = await runHealthChecks();
  const runtime = collectRuntimeMetrics({ sseConnections: totalSseConnections() });
  const { version, buildNumber } = getBuildInfo();
  const freeMem = os.freemem();
  const totalMem = os.totalmem();

  const terminals = tenantId ? listTerminals(tenantId) : [];
  const online = terminals.filter((t) => t.online).length;
  const byKind = (kind: string) =>
    terminals.filter((t) => t.deviceKind === kind).length;

  const swish = verifySwishIntegration({
    swishMerchantNumber: process.env.SWISH_MERCHANT_NUMBER,
    swishCertConfigured: Boolean(
      process.env.SWISH_CERT_PATH?.trim() || process.env.SWISH_CERT_PEM?.trim()
    ),
    swishKeyConfigured: Boolean(
      process.env.SWISH_KEY_PATH?.trim() || process.env.SWISH_KEY_PEM?.trim()
    ),
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    providerRegistered: true,
  });

  return {
    timestamp: new Date().toISOString(),
    buildVersion: version,
    buildNumber,
    nodeEnv: process.env.NODE_ENV ?? "development",
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg().map((v) => Math.round(v * 100) / 100),
    },
    memory: {
      ...runtime.memory,
      systemFreeMb: Math.round(freeMem / 1024 / 1024),
      systemTotalMb: Math.round(totalMem / 1024 / 1024),
    },
    database: {
      status: health.database.status,
      message: health.database.message,
    },
    realtime: {
      sseConnections: runtime.sseConnections,
      status: runtime.sseConnections > 0 ? "ok" : "degraded",
    },
    terminals: {
      total: terminals.length,
      online,
      offline: terminals.length - online,
      pos: byKind("pos"),
      kitchen: byKind("kitchen"),
      customerDisplay: byKind("customer-display"),
      offlineTerminals: terminals.filter((t) => (t.offlineQueueLength ?? 0) > 0).length,
    },
    printers: {
      status: "unknown",
      note: "Printer status reported per-terminal via heartbeat. Use operations to reconnect.",
    },
    swish,
  };
}
