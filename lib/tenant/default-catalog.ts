import { slugify } from "@/lib/categories";

export const DEFAULT_TENANT_CATEGORIES = [
  { name: "Pizza", slug: "pizza", sortOrder: 0 },
  { name: "Kebab", slug: "kebab", sortOrder: 1 },
  { name: "Dryck", slug: "dryck", sortOrder: 2 },
  { name: "Övrigt", slug: "ovrigt", sortOrder: 3 },
] as const;

export function defaultCategoryRows(tenantId: string) {
  return DEFAULT_TENANT_CATEGORIES.map((c) => ({
    tenantId,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sortOrder,
    active: true,
  }));
}

export function slugFromName(name: string): string {
  return slugify(name) || "kategori";
}
