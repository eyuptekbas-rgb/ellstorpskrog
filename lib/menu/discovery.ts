import { getDbErrorMessage, isPrismaConnectionError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

/**
 * Menu V3 — Discovery data layer (server only).
 *
 * Both helpers return ordered lists of *product IDs*. The client maps those IDs
 * back onto the already-fetched menu products, so we never duplicate product
 * data and we automatically skip anything that is no longer on the active menu.
 *
 * These reads are best-effort: any DB connection error degrades gracefully to an
 * empty list so the menu still renders. No business logic, cart, checkout or
 * payment behaviour depends on them.
 */

/**
 * Most-ordered products for the current tenant, highest quantity first.
 * Powers the public "Populärt" discovery section (shown to everyone).
 */
export async function getPopularProductIds(
  limit = 8,
  tenantId?: string
): Promise<string[]> {
  try {
    const resolvedTenantId = tenantId ?? (await resolvePublicTenantId());

    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { not: null },
        order: { tenantId: resolvedTenantId },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    return grouped
      .map((row) => row.productId)
      .filter((id): id is string => Boolean(id));
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("Popular products DB error:", getDbErrorMessage(error));
      return [];
    }
    throw error;
  }
}

/**
 * Distinct products the signed-in customer has ordered, most recent first.
 * Powers the "Senast beställt" section, which is ONLY rendered for logged-in
 * users (the caller passes the resolved userId / email).
 */
export async function getRecentlyOrderedProductIds(
  userId: string,
  email: string | null | undefined,
  limit = 8,
  tenantId?: string
): Promise<string[]> {
  try {
    const resolvedTenantId = tenantId ?? (await resolvePublicTenantId());

    const orders = await prisma.order.findMany({
      where: {
        tenantId: resolvedTenantId,
        OR: [
          { userId },
          ...(email ? [{ customerEmail: email }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        items: {
          select: { productId: true },
        },
      },
    });

    // Flatten items in recency order and dedupe, preserving first (most recent)
    // occurrence of each product.
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.productId || seen.has(item.productId)) continue;
        seen.add(item.productId);
        ordered.push(item.productId);
        if (ordered.length >= limit) return ordered;
      }
    }
    return ordered;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("Recent products DB error:", getDbErrorMessage(error));
      return [];
    }
    throw error;
  }
}
