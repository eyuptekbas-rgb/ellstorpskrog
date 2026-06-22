import { loadPrinterRegistry } from "./printer-registry";
import { resolveEscPosConfig } from "./escpos/config";

export type PrinterStatusTarget = {
  id: string;
  name: string;
  host: string;
  port: number;
};

/**
 * Printers to probe for status — only explicitly configured targets.
 * Skips default registry entries pointing at 192.168.1.100 unless ESC/POS is enabled.
 */
export function resolvePrinterStatusTargets(): PrinterStatusTarget[] {
  const globalConfig = resolveEscPosConfig();
  const globalHost = globalConfig.host.trim();
  const globalEnabled = globalConfig.enabled && globalHost.length > 0;

  const printers = loadPrinterRegistry().filter(
    (p) =>
      p.enabled &&
      (p.providerId === "network" || p.providerId === "network-escpos")
  );

  const targets: PrinterStatusTarget[] = [];

  for (const printer of printers) {
    const host = printer.networkHost?.trim();
    if (host) {
      targets.push({
        id: printer.id,
        name: printer.name,
        host,
        port: printer.networkPort ?? globalConfig.port,
      });
      continue;
    }

    if (globalEnabled) {
      targets.push({
        id: printer.id,
        name: printer.name,
        host: globalHost,
        port: printer.networkPort ?? globalConfig.port,
      });
    }
  }

  if (targets.length === 0 && globalEnabled) {
    targets.push({
      id: "default",
      name: "Default",
      host: globalHost,
      port: globalConfig.port,
    });
  }

  return targets;
}
