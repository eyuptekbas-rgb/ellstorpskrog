import { NextResponse } from "next/server";
import { getEmailDeliveryStats } from "@/lib/email/notifications/stats";
import { getFromAddress, isEmailConfigured } from "@/lib/email/resend";
import { ensureSiteSettings } from "@/lib/settings";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  try {
    const tenantId = await getAdminTenantId();
    const settings = await ensureSiteSettings(tenantId);
    const stats = await getEmailDeliveryStats(tenantId);

    return NextResponse.json({
      configured: isEmailConfigured(),
      fromAddress: getFromAddress(settings),
      fromEmailEnv: process.env.RESEND_FROM_EMAIL ?? null,
      restaurantEmail: settings.notificationEmail?.trim() || settings.email,
      stats,
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/notifications/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email stats" },
      { status: 500 }
    );
  }
}
