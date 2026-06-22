export type TerminalDeviceKind = "pos" | "kitchen" | "customer-display" | "delivery";

export type TerminalRecord = {
  id: string;
  tenantId: string;
  name: string;
  location: string;
  kitchen: string;
  lastSeen: string;
  online: boolean;
  deviceKind?: TerminalDeviceKind;
  printerStatus?: "ok" | "degraded" | "error" | "unknown";
  printQueueLength?: number;
  offlineQueueLength?: number;
  appVersion?: string;
};

type TerminalInput = {
  id: string;
  name: string;
  location: string;
  kitchen: string;
  deviceKind?: TerminalDeviceKind;
  printerStatus?: TerminalRecord["printerStatus"];
  printQueueLength?: number;
  offlineQueueLength?: number;
  appVersion?: string;
};

const ONLINE_THRESHOLD_MS = 45_000;
const store = new Map<string, TerminalRecord>();

function key(tenantId: string, terminalId: string) {
  return `${tenantId}:${terminalId}`;
}

export function upsertTerminalHeartbeat(
  tenantId: string,
  input: TerminalInput
): TerminalRecord {
  const now = new Date().toISOString();
  const existing = store.get(key(tenantId, input.id));
  const record: TerminalRecord = {
    id: input.id,
    tenantId,
    name: input.name.trim() || "Terminal",
    location: input.location.trim() || "—",
    kitchen: input.kitchen.trim() || "—",
    lastSeen: now,
    online: true,
    deviceKind: input.deviceKind ?? existing?.deviceKind ?? "pos",
    printerStatus: input.printerStatus ?? existing?.printerStatus ?? "unknown",
    printQueueLength: input.printQueueLength ?? existing?.printQueueLength ?? 0,
    offlineQueueLength: input.offlineQueueLength ?? existing?.offlineQueueLength ?? 0,
    appVersion: input.appVersion ?? existing?.appVersion,
  };
  store.set(key(tenantId, input.id), record);
  return record;
}

function withOnlineState(record: TerminalRecord): TerminalRecord {
  const age = Date.now() - new Date(record.lastSeen).getTime();
  return { ...record, online: age <= ONLINE_THRESHOLD_MS };
}

export function listTerminals(tenantId: string): TerminalRecord[] {
  const rows: TerminalRecord[] = [];
  for (const record of store.values()) {
    if (record.tenantId === tenantId) {
      rows.push(withOnlineState(record));
    }
  }
  return rows.sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );
}

export function getTerminal(
  tenantId: string,
  terminalId: string
): TerminalRecord | null {
  const record = store.get(key(tenantId, terminalId));
  return record ? withOnlineState(record) : null;
}

export function countOnlineTerminals(tenantId: string): number {
  return listTerminals(tenantId).filter((t) => t.online).length;
}
