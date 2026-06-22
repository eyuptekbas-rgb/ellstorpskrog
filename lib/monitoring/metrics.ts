type CounterMap = Map<string, number>;

const counters: CounterMap = new Map();

export function incrementMetric(name: string, by = 1) {
  counters.set(name, (counters.get(name) ?? 0) + by);
}

export function setMetric(name: string, value: number) {
  counters.set(name, value);
}

export function getMetric(name: string): number {
  return counters.get(name) ?? 0;
}

export function getAllMetrics(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}

export type RuntimeMetrics = {
  timestamp: string;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  uptimeSeconds: number;
  counters: Record<string, number>;
  sseConnections: number;
  printQueueLength: number;
  offlineQueueLength: number;
  printerStatus: "ok" | "degraded" | "unknown";
};

export function collectRuntimeMetrics(
  extras: Partial<RuntimeMetrics> = {}
): RuntimeMetrics {
  const mem = process.memoryUsage();
  return {
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
    uptimeSeconds: Math.round(process.uptime()),
    counters: getAllMetrics(),
    sseConnections: getMetric("sse.connections"),
    printQueueLength: getMetric("print.queue.length"),
    offlineQueueLength: getMetric("offline.queue.length"),
    printerStatus: "unknown",
    ...extras,
  };
}
