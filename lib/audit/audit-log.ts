import { writeStaffAudit } from "@/lib/staff/staff-service";

export const AUDIT_CATEGORIES = [
  "order",
  "payment",
  "refund",
  "printer",
  "settings",
  "security",
  "staff",
  "terminal",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export async function writeOperationalAudit(
  tenantId: string | null,
  actorUserId: string,
  category: AuditCategory,
  action: string,
  details?: string,
  targetUserId?: string
) {
  await writeStaffAudit(
    tenantId,
    actorUserId,
    category,
    action,
    targetUserId,
    details
  );
}

export async function safeWriteOperationalAudit(
  tenantId: string | null,
  actorUserId: string | undefined,
  category: AuditCategory,
  action: string,
  details?: string,
  targetUserId?: string
) {
  if (!actorUserId) return;
  try {
    await writeOperationalAudit(
      tenantId,
      actorUserId,
      category,
      action,
      details,
      targetUserId
    );
  } catch {
    // Audit must not block operational flows.
  }
}
