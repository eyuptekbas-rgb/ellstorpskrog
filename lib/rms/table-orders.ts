const STORAGE_KEY = "rms-order-table-map";

export type OrderTableAssignment = {
  orderId: string;
  tableId: string;
  tableName: string;
  assignedAt: string;
};

function readAll(): OrderTableAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OrderTableAssignment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(assignments: OrderTableAssignment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

export function getOrderTableAssignment(
  orderId: string
): OrderTableAssignment | null {
  return readAll().find((a) => a.orderId === orderId) ?? null;
}

export function getTableOrderAssignments(): OrderTableAssignment[] {
  return readAll();
}

export function assignOrderToTable(
  orderId: string,
  tableId: string,
  tableName: string
): OrderTableAssignment {
  const next = readAll().filter((a) => a.orderId !== orderId);
  const assignment: OrderTableAssignment = {
    orderId,
    tableId,
    tableName,
    assignedAt: new Date().toISOString(),
  };
  writeAll([assignment, ...next]);
  return assignment;
}

export function clearOrderTableAssignment(orderId: string) {
  writeAll(readAll().filter((a) => a.orderId !== orderId));
}

export function getOrdersForTable(tableId: string): OrderTableAssignment[] {
  return readAll().filter((a) => a.tableId === tableId);
}

export const TABLE_ADMIN_NOTE_PREFIX = "TABLE:";

export function tableAdminNote(tableName: string): string {
  return `${TABLE_ADMIN_NOTE_PREFIX}${tableName}`;
}

export function parseTableFromAdminNote(
  adminNote: string | null | undefined
): string | null {
  if (!adminNote?.startsWith(TABLE_ADMIN_NOTE_PREFIX)) return null;
  return adminNote.slice(TABLE_ADMIN_NOTE_PREFIX.length).trim() || null;
}
