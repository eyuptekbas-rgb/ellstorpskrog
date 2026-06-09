import { NextResponse } from "next/server";
import { getSeoSettings } from "@/lib/seo/metadata";
import { ensureSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await getSeoSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/seo error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO settings" },
      { status: 500 }
    );
  }
}

type UpdateSeoBody = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  keywords?: string | null;
};

export async function PATCH(req: Request) {
  try {
    await ensureSiteSettings();
    const body: UpdateSeoBody = await req.json();

    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        ...(body.metaTitle !== undefined && {
          metaTitle: body.metaTitle?.trim() || null,
        }),
        ...(body.metaDescription !== undefined && {
          metaDescription: body.metaDescription?.trim() || null,
        }),
        ...(body.ogImage !== undefined && {
          ogImage: body.ogImage?.trim() || null,
        }),
        ...(body.keywords !== undefined && {
          keywords: body.keywords?.trim() || null,
        }),
      },
    });

    return NextResponse.json({
      metaTitle: settings.metaTitle ?? "",
      metaDescription: settings.metaDescription ?? "",
      ogImage: settings.ogImage ?? "",
      keywords: settings.keywords ?? "",
      restaurantName: settings.restaurantName,
    });
  } catch (error) {
    console.error("PATCH /api/seo error:", error);
    return NextResponse.json(
      { error: "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}
