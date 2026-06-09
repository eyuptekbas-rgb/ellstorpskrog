import { NextResponse } from "next/server";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await ensureSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
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
};

export async function PATCH(req: Request) {
  try {
    await ensureSiteSettings();
    const body: UpdateSettingsBody = await req.json();

    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
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
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
