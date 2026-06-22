import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ensureSiteSettings } from "@/lib/settings";
import { toAdminSiteSettings } from "@/lib/settings/sanitize";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/require-permission";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  try {
    await requirePermission("settings");
    const tenantId = await getAdminTenantId();
    const settings = await ensureSiteSettings(tenantId);
    console.info("[PRINT-TRACE] GET /api/settings response", {
      tenantId,
      rmsTerminalSettings: settings.rmsTerminalSettings,
      rmsPrinterRegistry: settings.rmsPrinterRegistry,
      rmsEscposConfig: settings.rmsEscposConfig,
      rmsWindowsPrinterConfig: settings.rmsWindowsPrinterConfig,
    });
    return NextResponse.json(toAdminSiteSettings(settings));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

type UpdateSettingsBody = {
  restaurantName?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string | null;
  heroImage?: string | null;
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
  minimumOrder?: number;
  deliveryFee?: number;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  rmsTerminalSettings?: unknown;
  rmsPrinterRegistry?: unknown;
  rmsEscposConfig?: unknown;
  rmsWindowsPrinterConfig?: unknown;
};

function toNullableJsonInput(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function PATCH(req: Request) {
  try {
    await requirePermission("settings");
    const tenantId = await getAdminTenantId();
    await ensureSiteSettings(tenantId);
    const body: UpdateSettingsBody = await req.json();

    const settings = await prisma.siteSettings.update({
      where: { tenantId },
      data: {
        ...(body.restaurantName !== undefined && {
          restaurantName: body.restaurantName.trim(),
        }),
        ...(body.phone !== undefined && { phone: body.phone.trim() }),
        ...(body.email !== undefined && { email: body.email.trim() }),
        ...(body.address !== undefined && { address: body.address.trim() }),
        ...(body.logo !== undefined && { logo: body.logo || null }),
        ...(body.heroImage !== undefined && { heroImage: body.heroImage || null }),
        ...(body.deliveryEnabled !== undefined && {
          deliveryEnabled: body.deliveryEnabled,
        }),
        ...(body.pickupEnabled !== undefined && {
          pickupEnabled: body.pickupEnabled,
        }),
        ...(body.minimumOrder !== undefined && {
          minimumOrder: Math.max(0, Number(body.minimumOrder) || 0),
        }),
        ...(body.deliveryFee !== undefined && {
          deliveryFee: Math.max(0, Number(body.deliveryFee) || 0),
        }),
        ...(body.facebookUrl !== undefined && {
          facebookUrl: body.facebookUrl?.trim() || null,
        }),
        ...(body.instagramUrl !== undefined && {
          instagramUrl: body.instagramUrl?.trim() || null,
        }),
        ...(body.tiktokUrl !== undefined && {
          tiktokUrl: body.tiktokUrl?.trim() || null,
        }),
        ...(body.rmsTerminalSettings !== undefined && {
          rmsTerminalSettings: toNullableJsonInput(body.rmsTerminalSettings),
        }),
        ...(body.rmsPrinterRegistry !== undefined && {
          rmsPrinterRegistry: toNullableJsonInput(body.rmsPrinterRegistry),
        }),
        ...(body.rmsEscposConfig !== undefined && {
          rmsEscposConfig: toNullableJsonInput(body.rmsEscposConfig),
        }),
        ...(body.rmsWindowsPrinterConfig !== undefined && {
          rmsWindowsPrinterConfig: toNullableJsonInput(body.rmsWindowsPrinterConfig),
        }),
      },
    });

    return NextResponse.json(toAdminSiteSettings(settings));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
