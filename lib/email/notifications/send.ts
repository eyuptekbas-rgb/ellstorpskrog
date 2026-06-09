import {
  NotificationDeliveryStatus,
  NotificationType,
  type SiteSettings,
} from "@prisma/client";
import {
  getNotificationSubject,
  isNotificationEnabled,
} from "@/lib/email/notifications/registry";
import { renderNotificationEmail } from "@/lib/email/notifications/render";
import {
  getFromAddress,
  getResendClient,
  isEmailConfigured,
} from "@/lib/email/resend";
import type { OrderEmailData } from "@/lib/email/types";
import { ensureSiteSettings } from "@/lib/settings";
import { logError } from "@/lib/logging/production-logger";
import { prisma } from "@/lib/prisma";

export type SendNotificationResult = {
  logId: string;
  status: NotificationDeliveryStatus;
  skipped: boolean;
};

export async function sendNotification(params: {
  type: NotificationType;
  to: string;
  data: OrderEmailData;
  orderId?: string;
  settings?: SiteSettings;
  force?: boolean;
}): Promise<SendNotificationResult> {
  const settings = params.settings ?? (await ensureSiteSettings());
  const subject = getNotificationSubject(
    params.type,
    params.data.order.orderNumber,
    params.data.restaurantName
  );

  const log = await prisma.notificationLog.create({
    data: {
      orderId: params.orderId ?? params.data.order.id,
      type: params.type,
      recipient: params.to,
      subject,
      status: NotificationDeliveryStatus.PENDING,
    },
  });

  if (!params.force && !isNotificationEnabled(params.type, settings)) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: "Notification disabled in settings",
        sentAt: new Date(),
      },
    });
    return { logId: log.id, status: NotificationDeliveryStatus.SKIPPED, skipped: true };
  }

  if (!isEmailConfigured()) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: "RESEND_API_KEY not configured",
      },
    });
    return { logId: log.id, status: NotificationDeliveryStatus.FAILED, skipped: false };
  }

  const resend = getResendClient();
  if (!resend) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: "Resend client unavailable",
      },
    });
    return { logId: log.id, status: NotificationDeliveryStatus.FAILED, skipped: false };
  }

  try {
    const html = await renderNotificationEmail(params.type, params.data);
    const from = getFromAddress(settings);

    const { data: result, error } = await resend.emails.send({
      from,
      to: [params.to],
      subject,
      html,
    });

    if (error) {
      logError("Resend send failed", {
        context: "email/send",
        meta: { type: params.type, recipient: params.to, logId: log.id },
        error: error.message,
      });
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          errorMessage: error.message,
        },
      });
      return { logId: log.id, status: NotificationDeliveryStatus.FAILED, skipped: false };
    }

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: NotificationDeliveryStatus.SENT,
        resendId: result?.id ?? null,
        sentAt: new Date(),
      },
    });

    return { logId: log.id, status: NotificationDeliveryStatus.SENT, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown send error";
    logError("Notification send exception", {
      context: "email/send",
      meta: { type: params.type, logId: log.id },
      error,
    });
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: message,
      },
    });
    return { logId: log.id, status: NotificationDeliveryStatus.FAILED, skipped: false };
  }
}
