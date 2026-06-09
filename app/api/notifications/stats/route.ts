import { NextResponse } from "next/server";
import { getEmailDeliveryStats } from "@/lib/email/notifications/stats";
import { getFromAddress, isEmailConfigured } from "@/lib/email/resend";
import { ensureSiteSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await ensureSiteSettings();
    const stats = await getEmailDeliveryStats();

    return NextResponse.json({
      configured: isEmailConfigured(),
      fromAddress: getFromAddress(settings),
      fromEmailEnv: process.env.RESEND_FROM_EMAIL ?? null,
      restaurantEmail: settings.notificationEmail?.trim() || settings.email,
      stats,
    });
  } catch (error) {
    console.error("GET /api/notifications/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email stats" },
      { status: 500 }
    );
  }
}
