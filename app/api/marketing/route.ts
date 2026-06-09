import { NextResponse } from "next/server";
import { buildMarketingAdminConfig } from "@/lib/marketing/config";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await ensureSiteSettings();
    const config = buildMarketingAdminConfig(settings);
    return NextResponse.json({
      googleAnalyticsId: config.googleAnalyticsId,
      googleTagManagerId: config.googleTagManagerId,
      googleAdsConversionId: config.googleAdsConversionId,
      metaPixelId: config.metaPixelId,
      googleAnalyticsEnabled: config.googleAnalyticsEnabledToggle,
      googleTagManagerEnabled: config.googleTagManagerEnabledToggle,
      googleAdsEnabled: config.googleAdsEnabledToggle,
      metaPixelEnabled: config.metaPixelEnabledToggle,
      hasTracking: config.hasTracking,
    });
  } catch (error) {
    console.error("GET /api/marketing error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing settings" },
      { status: 500 }
    );
  }
}

type UpdateMarketingBody = {
  googleAnalyticsId?: string | null;
  googleTagManagerId?: string | null;
  googleAdsConversionId?: string | null;
  metaPixelId?: string | null;
  googleAnalyticsEnabled?: boolean;
  googleTagManagerEnabled?: boolean;
  googleAdsEnabled?: boolean;
  metaPixelEnabled?: boolean;
};

export async function PATCH(req: Request) {
  try {
    await ensureSiteSettings();
    const body: UpdateMarketingBody = await req.json();

    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        ...(body.googleAnalyticsId !== undefined && {
          googleAnalyticsId: body.googleAnalyticsId?.trim() || null,
        }),
        ...(body.googleTagManagerId !== undefined && {
          googleTagManagerId: body.googleTagManagerId?.trim() || null,
        }),
        ...(body.googleAdsConversionId !== undefined && {
          googleAdsConversionId: body.googleAdsConversionId?.trim() || null,
        }),
        ...(body.metaPixelId !== undefined && {
          metaPixelId: body.metaPixelId?.trim() || null,
        }),
        ...(body.googleAnalyticsEnabled !== undefined && {
          googleAnalyticsEnabled: body.googleAnalyticsEnabled,
        }),
        ...(body.googleTagManagerEnabled !== undefined && {
          googleTagManagerEnabled: body.googleTagManagerEnabled,
        }),
        ...(body.googleAdsEnabled !== undefined && {
          googleAdsEnabled: body.googleAdsEnabled,
        }),
        ...(body.metaPixelEnabled !== undefined && {
          metaPixelEnabled: body.metaPixelEnabled,
        }),
      },
    });

    const config = buildMarketingAdminConfig(settings);
    return NextResponse.json({
      googleAnalyticsId: config.googleAnalyticsId,
      googleTagManagerId: config.googleTagManagerId,
      googleAdsConversionId: config.googleAdsConversionId,
      metaPixelId: config.metaPixelId,
      googleAnalyticsEnabled: config.googleAnalyticsEnabledToggle,
      googleTagManagerEnabled: config.googleTagManagerEnabledToggle,
      googleAdsEnabled: config.googleAdsEnabledToggle,
      metaPixelEnabled: config.metaPixelEnabledToggle,
      hasTracking: config.hasTracking,
    });
  } catch (error) {
    console.error("PATCH /api/marketing error:", error);
    return NextResponse.json(
      { error: "Failed to update marketing settings" },
      { status: 500 }
    );
  }
}
