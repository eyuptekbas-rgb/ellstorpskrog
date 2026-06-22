/** @deprecated Use @/lib/printing/transport/network-escpos-client */
import { postNetworkEscPosJob } from "../transport/network-escpos-client";
import { resolveEscPosConfig } from "../escpos/config";
import type { PrintResult } from "../types";

export type EscPosTransportConfig = {
  host: string;
  port: number;
};

export async function postEscPosJob(
  config: EscPosTransportConfig,
  bytes: Uint8Array,
  meta: { documentType?: string; drawerOnly?: boolean }
): Promise<PrintResult> {
  const result = await postNetworkEscPosJob(config.host, config.port, bytes, {
    drawerOnly: meta.drawerOnly,
    skipStatusCheck: true,
  });
  return { ...result, providerId: "network" };
}

export function resolveActiveEscPosTarget(printer?: {
  networkHost?: string;
  networkPort?: number;
}): EscPosTransportConfig | null {
  const config = resolveEscPosConfig(printer);
  if (!config.enabled || !config.host.trim()) return null;
  return { host: config.host.trim(), port: config.port };
}
