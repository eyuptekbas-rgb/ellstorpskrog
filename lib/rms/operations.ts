export const RMS_OPERATION_TYPES = [
  "restart-realtime",
  "reconnect-printers",
  "clear-print-queue",
  "resync-terminals",
  "export-logs",
] as const;

export type RmsOperationType = (typeof RMS_OPERATION_TYPES)[number];

export type RmsOperationPayload = {
  operation: RmsOperationType;
  at: string;
  initiatedBy?: string;
};

export function isRmsOperationType(value: string): value is RmsOperationType {
  return (RMS_OPERATION_TYPES as readonly string[]).includes(value);
}
