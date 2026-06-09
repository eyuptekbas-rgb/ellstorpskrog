import {
  NotificationDeliveryStatus,
  NotificationType,
} from "@prisma/client";
import {
  getNotificationSubject,
  isNotificationEnabled,
} from "@/lib/email/notifications/registry";
import { renderNotificationEmail } from "@/lib/email/notifications/render";
import { sendNotification } from "@/lib/email/notifications/send";
import { buildOrderEmailData } from "@/lib/email/types";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

const MAX_RETRIES = 3;

export async function retryFailedNotification(logId: string) {
  const log = await prisma.notificationLog.findUnique({ where: { id: logId } });

  if (!log) {
    throw new Error("Loggpost hittades inte");
  }

  if (log.status !== NotificationDeliveryStatus.FAILED) {
    throw new Error("Endast misslyckade utskick kan försökas igen");
  }

  if (log.retryCount >= MAX_RETRIES) {
    throw new Error(`Max antal försök (${MAX_RETRIES}) uppnått`);
  }

  if (!log.orderId) {
    throw new Error("Order saknas — kan inte försöka igen");
  }

  const order = await prisma.order.findUnique({
    where: { id: log.orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order hittades inte");
  }

  await prisma.notificationLog.update({
    where: { id: logId },
    data: {
      status: NotificationDeliveryStatus.PENDING,
      errorMessage: null,
      retryCount: { increment: 1 },
    },
  });

  const settings = await ensureSiteSettings();
  const data = buildOrderEmailData(order, settings);

  return resendExistingLog({
    logId,
    type: log.type,
    to: log.recipient,
    data,
    orderId: order.id,
    settings,
    force: true,
  });
}

export async function retryAllFailedNotifications(limit = 10) {
  const failed = await prisma.notificationLog.findMany({
    where: {
      status: NotificationDeliveryStatus.FAILED,
      retryCount: { lt: MAX_RETRIES },
      orderId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const results = [];
  for (const log of failed) {
    try {
      const result = await retryFailedNotification(log.id);
      results.push({ logId: log.id, ok: true, status: result.status });
    } catch (error) {
      results.push({
        logId: log.id,
        ok: false,
        error: error instanceof Error ? error.message : "Retry failed",
      });
    }
  }

  return results;
}

async function resendExistingLog(params: {
  logId: string;
  type: NotificationType;
  to: string;
  data: ReturnType<typeof buildOrderEmailData>;
  orderId: string;
  settings: Awaited<ReturnType<typeof ensureSiteSettings>>;
  force: boolean;
}) {
  const { getFromAddress, getResendClient, isEmailConfigured } = await import(
    "@/lib/email/resend"
  );

  if (!isEmailConfigured()) {
    await prisma.notificationLog.update({
      where: { id: params.logId },
      data: {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: "RESEND_API_KEY not configured",
      },
    });
    return { logId: params.logId, status: NotificationDeliveryStatus.FAILED, skipped: false };
  }

  const resend = getResendClient();
  if (!resend) {
    await prisma.notificationLog.update({
      where: { id: params.logId },
      data: {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: "Resend client unavailable",
      },
    });
    return { logId: params.logId, status: NotificationDeliveryStatus.FAILED, skipped: false };
  }

  if (!params.force && !isNotificationEnabled(params.type, params.settings)) {
    await prisma.notificationLog.update({
      where: { id: params.logId },
      data: {
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: "Notification disabled in settings",
        sentAt: new Date(),
      },
    });
    return { logId: params.logId, status: NotificationDeliveryStatus.SKIPPED, skipped: true };
  }

  const subject = getNotificationSubject(
    params.type,
    params.data.order.orderNumber,
    params.data.restaurantName
  );

  try {
    const html = await renderNotificationEmail(params.type, params.data);
    const from = getFromAddress(params.settings);

    const { data: result, error } = await resend.emails.send({
      from,
      to: [params.to],
      subject,
      html,
    });

    if (error) {
      await prisma.notificationLog.update({
        where: { id: params.logId },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          errorMessage: error.message,
        },
      });
      return { logId: params.logId, status: NotificationDeliveryStatus.FAILED, skipped: false };
    }

    await prisma.notificationLog.update({
      where: { id: params.logId },
      data: {
        status: NotificationDeliveryStatus.SENT,
        resendId: result?.id ?? null,
        sentAt: new Date(),
        errorMessage: null,
      },
    });

    return { logId: params.logId, status: NotificationDeliveryStatus.SENT, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown send error";
    await prisma.notificationLog.update({
      where: { id: params.logId },
      data: {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: message,
      },
    });
    return { logId: params.logId, status: NotificationDeliveryStatus.FAILED, skipped: false };
  }
}

/** Send test email using sample or real order data */
export async function sendTestNotification(params: {
  type: NotificationType;
  recipient: string;
  orderId?: string;
}) {
  const settings = await ensureSiteSettings();

  let order;
  if (params.orderId) {
    order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    });
  }

  if (!order) {
    const { buildSampleOrder } = await import(
      "@/lib/email/notifications/sample-data"
    );
    order = buildSampleOrder(settings, { customerEmail: params.recipient });
  }

  return sendNotification({
    type: params.type,
    to: params.recipient,
    data: buildOrderEmailData(order, settings),
    orderId: order.id.startsWith("sample") ? undefined : order.id,
    settings,
    force: true,
  });
}

export { sendNotification, MAX_RETRIES };
