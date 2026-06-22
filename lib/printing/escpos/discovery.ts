import { pingPrinter } from "./status";

export type DiscoveredPrinter = {
  host: string;
  port: number;
  reachable: boolean;
  latencyMs?: number;
  error?: string;
};

/** Probe a list of hosts for ESC/POS printers on TCP 9100. */
export async function discoverNetworkPrinters(
  hosts: string[],
  port = 9100,
  timeoutMs = 2_000
): Promise<DiscoveredPrinter[]> {
  const uniqueHosts = [...new Set(hosts.map((h) => h.trim()).filter(Boolean))];

  return Promise.all(
    uniqueHosts.map(async (host) => {
      const result = await pingPrinter(host, port, timeoutMs);
      return {
        host,
        port,
        reachable: result.reachable,
        latencyMs: result.latencyMs,
        error: result.error,
      };
    })
  );
}

/** Generate common subnet host candidates from a base IP (e.g. 192.168.1.100 → .1-.254). */
export function subnetHostCandidates(baseIp: string): string[] {
  const parts = baseIp.trim().split(".");
  if (parts.length !== 4) return [];
  const prefix = parts.slice(0, 3).join(".");
  const hosts: string[] = [];
  for (let i = 1; i <= 254; i++) {
    hosts.push(`${prefix}.${i}`);
  }
  return hosts;
}

/** Discover printers on the /24 subnet of a seed IP. */
export async function discoverSubnetPrinters(
  seedIp: string,
  port = 9100
): Promise<DiscoveredPrinter[]> {
  const candidates = subnetHostCandidates(seedIp);
  const results = await discoverNetworkPrinters(candidates.slice(0, 32), port);
  return results.filter((r) => r.reachable);
}
