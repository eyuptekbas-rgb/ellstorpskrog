import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findTenantProduct, requireTenantScope } from "@/lib/tenant/scope";
import { tenantApiError } from "@/lib/tenant/admin-api";

type OptionGroupInput = {
  id?: string;
  name: string;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
  options?: Array<{
    id?: string;
    name: string;
    priceModifier?: number;
    sortOrder?: number;
  }>;
};

type Body = {
  groups: OptionGroupInput[];
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await requireTenantScope();
    const { id } = await params;
    const body: Body = await req.json();

    const product = await findTenantProduct(id, tenantId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const groups = body.groups ?? [];

    await prisma.$transaction(async (tx) => {
      await tx.productOptionGroup.deleteMany({ where: { productId: id } });

      for (const [groupIndex, group] of groups.entries()) {
        const createdGroup = await tx.productOptionGroup.create({
          data: {
            productId: id,
            name: group.name.trim(),
            required: group.required ?? false,
            minSelect: Math.max(0, group.minSelect ?? 0),
            maxSelect: Math.max(1, group.maxSelect ?? 1),
            sortOrder: group.sortOrder ?? groupIndex,
          },
        });

        const options = group.options ?? [];
        if (options.length > 0) {
          await tx.productOptionItem.createMany({
            data: options.map((option, optionIndex) => ({
              groupId: createdGroup.id,
              name: option.name.trim(),
              priceModifier: Math.round(option.priceModifier ?? 0),
              sortOrder: option.sortOrder ?? optionIndex,
            })),
          });
        }
      }
    });

    const refreshed = await prisma.product.findUnique({
      where: { id },
      include: {
        optionGroups: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    return NextResponse.json(refreshed?.optionGroups ?? []);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PUT /api/products/[id]/option-groups error:", error);
    return NextResponse.json(
      { error: "Failed to save option groups" },
      { status: 500 }
    );
  }
}
