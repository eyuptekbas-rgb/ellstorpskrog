import { NextResponse } from "next/server";
import {
  CUSTOMER_NOTIFICATION_TYPES,
  NOTIFICATION_SETTINGS_KEY,
  NOTIFICATION_TYPE_LABELS,
  RESTAURANT_NOTIFICATION_TYPES,
} from "@/lib/email/notifications/registry";
import { getRestaurantNotificationEmail } from "@/lib/email/types";
import { getFromAddress, isEmailConfigured } from "@/lib/email/resend";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

function serializeSettings(settings: Awaited<ReturnType<typeof ensureSiteSettings>>) {
  const toggles = Object.fromEntries(
    [...CUSTOMER_NOTIFICATION_TYPES, ...RESTAURANT_NOTIFICATION_TYPES].map(
      (type) => [NOTIFICATION_SETTINGS_KEY[type], settings[NOTIFICATION_SETTINGS_KEY[type]]]
    )
  );

  return {
    notificationEmail: settings.notificationEmail ?? "",
    emailSenderName: settings.emailSenderName ?? "",
    emailSenderAddress: settings.emailSenderAddress ?? "",
    customerEmailsEnabled: settings.customerEmailsEnabled,
    restaurantEmailsEnabled: settings.restaurantEmailsEnabled,
    ...toggles,
    contactEmail: settings.email,
    effectiveRestaurantEmail: getRestaurantNotificationEmail(settings),
    effectiveFromAddress: getFromAddress(settings),
    emailConfigured: isEmailConfigured(),
    notificationTypes: {
      customer: CUSTOMER_NOTIFICATION_TYPES.map((type) => ({
        type,
        label: NOTIFICATION_TYPE_LABELS[type],
        settingsKey: NOTIFICATION_SETTINGS_KEY[type],
      })),
      restaurant: RESTAURANT_NOTIFICATION_TYPES.map((type) => ({
        type,
        label: NOTIFICATION_TYPE_LABELS[type],
        settingsKey: NOTIFICATION_SETTINGS_KEY[type],
      })),
    },
  };
}

export async function GET() {
  try {
    const settings = await ensureSiteSettings();
    return NextResponse.json(serializeSettings(settings));
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

type UpdateNotificationsBody = {
  notificationEmail?: string | null;
  emailSenderName?: string | null;
  emailSenderAddress?: string | null;
  customerEmailsEnabled?: boolean;
  restaurantEmailsEnabled?: boolean;
  notifyCustomerOrderConfirmation?: boolean;
  notifyCustomerPaymentConfirmation?: boolean;
  notifyCustomerOrderReady?: boolean;
  notifyCustomerOrderDelivered?: boolean;
  notifyCustomerOrderCancelled?: boolean;
  notifyRestaurantNewOrder?: boolean;
  notifyRestaurantPaymentReceived?: boolean;
  notifyRestaurantOrderCancelled?: boolean;
};

export async function PATCH(req: Request) {
  try {
    await ensureSiteSettings();
    const body: UpdateNotificationsBody = await req.json();

    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        ...(body.notificationEmail !== undefined && {
          notificationEmail: body.notificationEmail?.trim() || null,
        }),
        ...(body.emailSenderName !== undefined && {
          emailSenderName: body.emailSenderName?.trim() || null,
        }),
        ...(body.emailSenderAddress !== undefined && {
          emailSenderAddress: body.emailSenderAddress?.trim() || null,
        }),
        ...(body.customerEmailsEnabled !== undefined && {
          customerEmailsEnabled: body.customerEmailsEnabled,
        }),
        ...(body.restaurantEmailsEnabled !== undefined && {
          restaurantEmailsEnabled: body.restaurantEmailsEnabled,
        }),
        ...(body.notifyCustomerOrderConfirmation !== undefined && {
          notifyCustomerOrderConfirmation: body.notifyCustomerOrderConfirmation,
        }),
        ...(body.notifyCustomerPaymentConfirmation !== undefined && {
          notifyCustomerPaymentConfirmation: body.notifyCustomerPaymentConfirmation,
        }),
        ...(body.notifyCustomerOrderReady !== undefined && {
          notifyCustomerOrderReady: body.notifyCustomerOrderReady,
        }),
        ...(body.notifyCustomerOrderDelivered !== undefined && {
          notifyCustomerOrderDelivered: body.notifyCustomerOrderDelivered,
        }),
        ...(body.notifyCustomerOrderCancelled !== undefined && {
          notifyCustomerOrderCancelled: body.notifyCustomerOrderCancelled,
        }),
        ...(body.notifyRestaurantNewOrder !== undefined && {
          notifyRestaurantNewOrder: body.notifyRestaurantNewOrder,
        }),
        ...(body.notifyRestaurantPaymentReceived !== undefined && {
          notifyRestaurantPaymentReceived: body.notifyRestaurantPaymentReceived,
        }),
        ...(body.notifyRestaurantOrderCancelled !== undefined && {
          notifyRestaurantOrderCancelled: body.notifyRestaurantOrderCancelled,
        }),
      },
    });

    return NextResponse.json(serializeSettings(settings));
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
