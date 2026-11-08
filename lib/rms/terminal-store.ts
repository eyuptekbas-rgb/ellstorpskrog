import { prisma } from "@/lib/prisma";

export type TerminalDeviceKind = "pos" | "kitchen" | "customer-display" | "delivery";
export type TerminalPrinterStatus = "ok" | "degraded" | "error" | "unknown";

export type TerminalRecord = {
  id: string; tenantId: string; name: string; location: string; kitchen: string;
  lastSeen: string; online: boolean; deviceKind?: TerminalDeviceKind;
  printerStatus?: TerminalPrinterStatus; printQueueLength?: number;
  offlineQueueLength?: number; appVersion?: string;
};

type TerminalInput = Omit<TerminalRecord, "tenantId" | "lastSeen" | "online">;
const ONLINE_THRESHOLD_MS = 45_000;

function toTerminalRecord(row: {
  id: string; tenantId: string; name: string; location: string; kitchen: string;
  lastSeen: Date; deviceKind: string; printerStatus: string; printQueueLength: number;
  offlineQueueLength: number; appVersion: string | null;
}): TerminalRecord {
  return {
    ...row,
    lastSeen: row.lastSeen.toISOString(),
    online: Date.now() - row.lastSeen.getTime() <= ONLINE_THRESHOLD_MS,
    deviceKind: row.deviceKind as TerminalDeviceKind,
    printerStatus: row.printerStatus as TerminalPrinterStatus,
    appVersion: row.appVersion ?? undefined,
  };
}

export async function upsertTerminalHeartbeat(
  tenantId: string,
  input: TerminalInput
): Promise<TerminalRecord> {
  const existing = await prisma.rmsTerminal.findUnique({ where: { id: input.id } });
  if (existing && existing.tenantId !== tenantId) {
    throw new Error("Terminal id belongs to another tenant");
  }
  const row = await prisma.rmsTerminal.upsert({
    where: { id: input.id },
    create: {
      id: input.id, tenantId, name: input.name.trim() || "Terminal",
      location: input.location.trim() || "—", kitchen: input.kitchen.trim() || "—",
      deviceKind: input.deviceKind ?? "pos", printerStatus: input.printerStatus ?? "unknown",
      printQueueLength: input.printQueueLength ?? 0,
      offlineQueueLength: input.offlineQueueLength ?? 0, appVersion: input.appVersion,
    },
    update: {
      name: input.name.trim() || "Terminal", location: input.location.trim() || "—",
      kitchen: input.kitchen.trim() || "—", deviceKind: input.deviceKind,
      printerStatus: input.printerStatus, printQueueLength: input.printQueueLength,
      offlineQueueLength: input.offlineQueueLength, appVersion: input.appVersion,
      lastSeen: new Date(),
    },
  });
  return toTerminalRecord(row);
}

export async function listTerminals(tenantId: string): Promise<TerminalRecord[]> {
  const rows = await prisma.rmsTerminal.findMany({
    where: { tenantId }, orderBy: { lastSeen: "desc" },
  });
  return rows.map(toTerminalRecord);
}

export async function getTerminal(tenantId: string, terminalId: string): Promise<TerminalRecord | null> {
  const row = await prisma.rmsTerminal.findFirst({ where: { id: terminalId, tenantId } });
  return row ? toTerminalRecord(row) : null;
}

export async function countOnlineTerminals(tenantId: string): Promise<number> {
  return prisma.rmsTerminal.count({
    where: { tenantId, lastSeen: { gte: new Date(Date.now() - ONLINE_THRESHOLD_MS) } },
  });
}
