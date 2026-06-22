import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OPENING_HOURS } from "@/lib/openingHours";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  isValidTemplateId,
} from "@/lib/tenant/templates";
import { defaultCategoryRows } from "@/lib/tenant/default-catalog";
import { allocateCustomerNumber } from "@/lib/billing/customer-number";

const DEFAULT_SETTINGS = {
  restaurantName: "Ny restaurang",
  phone: "+46 00 000 00 00",
  email: "info@example.com",
  address: "Adress",
  heroImage: "/hero.jpg",
  deliveryEnabled: true,
  pickupEnabled: true,
  minimumOrder: 0,
  deliveryFee: 49,
};

export async function GET() {
  try {
    await requirePlatformAdmin();

    const tenants = await prisma.tenant.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            orders: true,
            categories: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/platform/tenants error:", error);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}

type CreateTenantBody = {
  name: string;
  slug?: string;
  templateId?: string;
  primaryColor?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminName?: string;
};

export async function POST(req: Request) {
  try {
    await requirePlatformAdmin();
    const body: CreateTenantBody = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || slugify(name)).toLowerCase();
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const templateId = isValidTemplateId(body.templateId ?? "")
      ? body.templateId!
      : DEFAULT_TEMPLATE_ID;
    const template = getTemplate(templateId);

    const tenant = await prisma.$transaction(async (tx) => {
      const customerNumber = await allocateCustomerNumber(tx);
      const created = await tx.tenant.create({
        data: {
          name,
          slug,
          templateId,
          primaryColor: body.primaryColor?.trim() || template.defaultPrimary,
          customerNumber,
        },
      });

      await tx.siteSettings.create({
        data: {
          tenantId: created.id,
          ...DEFAULT_SETTINGS,
          restaurantName: name,
        },
      });

      for (const hours of DEFAULT_OPENING_HOURS) {
        await tx.openingHours.create({
          data: { tenantId: created.id, ...hours },
        });
      }

      await tx.category.createMany({
        data: defaultCategoryRows(created.id),
      });

      if (body.adminEmail && body.adminPassword) {
        const passwordHash = await hashPassword(body.adminPassword);
        await tx.user.create({
          data: {
            email: body.adminEmail.trim().toLowerCase(),
            name: body.adminName?.trim() || `${name} Admin`,
            passwordHash,
            role: "ADMIN",
            tenantId: created.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/platform/tenants error:", error);
    const message =
      error instanceof Error &&
      error.message.includes("Unknown argument `templateId`")
        ? "Databasen behöver uppdateras. Kör: npx prisma generate och starta om servern."
        : error instanceof Error
          ? error.message
          : "Failed to create tenant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
