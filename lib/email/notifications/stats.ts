import { NotificationDeliveryStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EmailDeliveryStats = {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
  deliveryRate: number;
  last24Hours: {
    total: number;
    sent: number;
    failed: number;
  };
  last7Days: {
    total: number;
    sent: number;
    failed: number;
  };
  byType: Array<{
    type: string;
    label: string;
    sent: number;
    failed: number;
    total: number;
  }>;
};

export async function getEmailDeliveryStats(): Promise<EmailDeliveryStats> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    sent,
    failed,
    skipped,
    pending,
    last24Total,
    last24Sent,
    last24Failed,
    last7Total,
    last7Sent,
    last7Failed,
    typeGroups,
  ] = await Promise.all([
    prisma.notificationLog.count(),
    prisma.notificationLog.count({ where: { status: NotificationDeliveryStatus.SENT } }),
    prisma.notificationLog.count({ where: { status: NotificationDeliveryStatus.FAILED } }),
    prisma.notificationLog.count({ where: { status: NotificationDeliveryStatus.SKIPPED } }),
    prisma.notificationLog.count({ where: { status: NotificationDeliveryStatus.PENDING } }),
    prisma.notificationLog.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.notificationLog.count({
      where: { createdAt: { gte: dayAgo }, status: NotificationDeliveryStatus.SENT },
    }),
    prisma.notificationLog.count({
      where: { createdAt: { gte: dayAgo }, status: NotificationDeliveryStatus.FAILED },
    }),
    prisma.notificationLog.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.notificationLog.count({
      where: { createdAt: { gte: weekAgo }, status: NotificationDeliveryStatus.SENT },
    }),
    prisma.notificationLog.count({
      where: { createdAt: { gte: weekAgo }, status: NotificationDeliveryStatus.FAILED },
    }),
    prisma.notificationLog.groupBy({
      by: ["type", "status"],
      _count: { status: true },
    }),
  ]);

  const typeMap = new Map<string, { sent: number; failed: number; total: number }>();
  for (const row of typeGroups) {
    const entry = typeMap.get(row.type) ?? { sent: 0, failed: 0, total: 0 };
    entry.total += row._count.status;
    if (row.status === NotificationDeliveryStatus.SENT) entry.sent += row._count.status;
    if (row.status === NotificationDeliveryStatus.FAILED) entry.failed += row._count.status;
    typeMap.set(row.type, entry);
  }

  const { NOTIFICATION_TYPE_LABELS } = await import(
    "@/lib/email/notifications/registry"
  );

  return {
    total,
    sent,
    failed,
    skipped,
    pending,
    deliveryRate: total > 0 ? Math.round((sent / total) * 100) : 0,
    last24Hours: { total: last24Total, sent: last24Sent, failed: last24Failed },
    last7Days: { total: last7Total, sent: last7Sent, failed: last7Failed },
    byType: Array.from(typeMap.entries()).map(([type, counts]) => ({
      type,
      label: NOTIFICATION_TYPE_LABELS[type as keyof typeof NOTIFICATION_TYPE_LABELS] ?? type,
      ...counts,
    })),
  };
}
