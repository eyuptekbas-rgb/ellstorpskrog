export type TableContext = {
  tableId: string | null;
  tableName: string | null;
  source: "qr" | "url" | "manual" | null;
};

export function parseTableFromSearchParams(
  params: URLSearchParams
): TableContext {
  const tableId = params.get("tableId")?.trim() || null;
  const table = params.get("table")?.trim() || null;
  const qr = params.get("qr")?.trim() || null;

  if (tableId) {
    return { tableId, tableName: table || tableId, source: qr ? "qr" : "url" };
  }
  if (table) {
    return { tableId: null, tableName: table, source: qr ? "qr" : "url" };
  }
  return { tableId: null, tableName: null, source: null };
}

export function buildSelfOrderUrl(tableName: string, baseUrl?: string): string {
  const origin =
    baseUrl ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams({ table: tableName, qr: "1" });
  return `${origin}/order?${params.toString()}`;
}

export function formatTableNote(table: TableContext, note?: string): string {
  const parts: string[] = [];
  if (table.tableName) parts.push(`Bord: ${table.tableName}`);
  if (table.tableId) parts.push(`TableId: ${table.tableId}`);
  if (note?.trim()) parts.push(note.trim());
  return parts.join(" · ");
}
