import { publishToTenant } from "./bus";
import type { RmsOperationPayload, RmsOperationType } from "@/lib/rms/operations";

export function publishRmsOperation(
  tenantId: string,
  operation: RmsOperationType,
  initiatedBy?: string
) {
  const payload: RmsOperationPayload = {
    operation,
    at: new Date().toISOString(),
    initiatedBy,
  };

  publishToTenant(tenantId, {
    type: "RmsOperation",
    tenantId,
    payload: payload as unknown as Record<string, unknown>,
    at: payload.at,
  });
}
