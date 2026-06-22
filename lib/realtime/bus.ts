import type { RealtimeEvent, RealtimeSubscriber } from "./types";
import { incrementMetric, setMetric } from "@/lib/monitoring/metrics";

type TenantChannel = {
  subscribers: Set<RealtimeSubscriber>;
};

const channels = new Map<string, TenantChannel>();

function getChannel(tenantId: string): TenantChannel {
  let channel = channels.get(tenantId);
  if (!channel) {
    channel = { subscribers: new Set() };
    channels.set(tenantId, channel);
  }
  return channel;
}

export function subscribeTenant(
  tenantId: string,
  subscriber: RealtimeSubscriber
): () => void {
  const channel = getChannel(tenantId);
  channel.subscribers.add(subscriber);
  incrementMetric("sse.connections");
  setMetric("sse.connections", totalSseConnections());
  return () => {
    channel.subscribers.delete(subscriber);
    if (channel.subscribers.size === 0) channels.delete(tenantId);
    setMetric("sse.connections", totalSseConnections());
  };
}

export function totalSseConnections(): number {
  let total = 0;
  for (const channel of channels.values()) {
    total += channel.subscribers.size;
  }
  return total;
}

export function publishToTenant(tenantId: string, event: RealtimeEvent) {
  const channel = channels.get(tenantId);
  if (!channel) return;
  for (const subscriber of channel.subscribers) {
    try {
      subscriber(event);
    } catch {
      // Ignore broken subscriber callbacks.
    }
  }
}

export function formatSse(event: RealtimeEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export function formatSsePing(): string {
  return `: ping ${Date.now()}\n\n`;
}
