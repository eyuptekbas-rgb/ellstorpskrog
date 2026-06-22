"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Flame,
  GripVertical,
  Leaf,
  Loader2,
  PackageX,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wheat,
} from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import { slugify } from "@/lib/categories";
import type {
  AdminMenuCategory,
  AdminMenuProduct,
  CategoryDraft,
  MenuFilters,
  ProductDraft,
} from "@/lib/admin/menu-types";
import {
  defaultMenuFilters,
  emptyCategoryDraft,
  emptyProductDraft,
} from "@/lib/admin/menu-types";
import AdminToastStack, { useAdminToast } from "./AdminToast";
import CategoryEditorSheet from "./CategoryEditorSheet";
import ProductEditorSheet from "./ProductEditorSheet";

function productToDraft(product: AdminMenuProduct): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    ingredients: product.ingredients,
    allergens: product.allergens,
    price: String(product.price),
    campaignPrice:
      product.campaignPrice != null ? String(product.campaignPrice) : "",
    campaignStart: product.campaignStart?.slice(0, 10) ?? "",
    campaignEnd: product.campaignEnd?.slice(0, 10) ?? "",
    image: product.image ?? "",
    categoryId: product.categoryId,
    active: product.active,
    hidden: product.hidden,
    soldOut: product.soldOut,
    isPopular: product.isPopular,
    isNew: product.isNew,
    isVegetarian: product.isVegetarian,
    isGlutenFree: product.isGlutenFree,
    spicyLevel: product.spicyLevel,
    optionGroups: product.optionGroups,
  };
}

function categoryToDraft(category: AdminMenuCategory): CategoryDraft {
  return {
    name: category.name,
    slug: category.slug,
    image: category.image ?? "",
    icon: category.icon ?? "",
    active: category.active,
  };
}

function buildProductPayload(draft: ProductDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    ingredients: draft.ingredients.trim(),
    allergens: draft.allergens.trim(),
    price: Number(draft.price),
    campaignPrice: draft.campaignPrice ? Number(draft.campaignPrice) : null,
    campaignStart: draft.campaignStart || null,
    campaignEnd: draft.campaignEnd || null,
    image: draft.image || null,
    categoryId: draft.categoryId,
    active: draft.active,
    hidden: draft.hidden,
    soldOut: draft.soldOut,
    isPopular: draft.isPopular,
    isNew: draft.isNew,
    isVegetarian: draft.isVegetarian,
    isGlutenFree: draft.isGlutenFree,
    spicyLevel: draft.spicyLevel,
  };
}

export default function MenuAdminClient() {
  const { toasts, push, dismiss } = useAdminToast();
  const [categories, setCategories] = useState<AdminMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<MenuFilters>(defaultMenuFilters());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [reorderMode, setReorderMode] = useState(false);
  const [dragKind, setDragKind] = useState<"category" | "product" | null>(
    null
  );
  const [dragId, setDragId] = useState<string | null>(null);

  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminMenuProduct | null>(
    null
  );
  const [productDraft, setProductDraft] = useState<ProductDraft>(
    emptyProductDraft()
  );
  const [productDirty, setProductDirty] = useState(false);
  const savedProductDraft = useRef<ProductDraft | null>(null);

  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<AdminMenuCategory | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(
    emptyCategoryDraft()
  );
  const [categoryDirty, setCategoryDirty] = useState(false);

  const hasUnsaved =
    (productSheetOpen && productDirty) || (categorySheetOpen && categoryDirty);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.categoryId !== "all")
        params.set("categoryId", filters.categoryId);
      if (filters.availability !== "all")
        params.set("availability", filters.availability);
      if (filters.soldOut !== "all") params.set("soldOut", filters.soldOut);

      const res = await fetch(`/api/admin/menu?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data: AdminMenuCategory[] = await res.json();
      setCategories(data);
    } catch {
      push("Kunde inte hämta menyn.", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, push]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMenu();
    }, filters.search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchMenu, filters.search]);

  useEffect(() => {
    void fetchMenu();
  }, [
    filters.categoryId,
    filters.availability,
    filters.soldOut,
    fetchMenu,
  ]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  const toggleCollapsed = (categoryId: string) => {
    setCollapsed((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const closeProductSheet = () => {
    if (
      productDirty &&
      !window.confirm("Du har osparade ändringar. Stäng ändå?")
    ) {
      return;
    }
    setProductSheetOpen(false);
    setEditingProduct(null);
    setProductDraft(emptyProductDraft());
    setProductDirty(false);
    savedProductDraft.current = null;
  };

  const closeCategorySheet = () => {
    if (
      categoryDirty &&
      !window.confirm("Du har osparade ändringar. Stäng ändå?")
    ) {
      return;
    }
    setCategorySheetOpen(false);
    setEditingCategory(null);
    setCategoryDraft(emptyCategoryDraft());
    setCategoryDirty(false);
  };

  const openCreateProduct = (categoryId?: string) => {
    if (categories.length === 0) {
      push("Skapa en kategori först.", "error");
      return;
    }
    const targetCategory = categoryId ?? categories[0]?.id ?? "";
    setEditingProduct(null);
    setProductDraft(emptyProductDraft(targetCategory));
    setProductDirty(false);
    setProductSheetOpen(true);
  };

  const openEditProduct = (product: AdminMenuProduct) => {
    const draft = productToDraft(product);
    setEditingProduct(product);
    setProductDraft(draft);
    savedProductDraft.current = draft;
    setProductDirty(false);
    setProductSheetOpen(true);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryDraft(emptyCategoryDraft());
    setCategoryDirty(false);
    setCategorySheetOpen(true);
  };

  const openEditCategory = (category: AdminMenuCategory) => {
    setEditingCategory(category);
    setCategoryDraft(categoryToDraft(category));
    setCategoryDirty(false);
    setCategorySheetOpen(true);
  };

  const patchProductDraft = (patch: Partial<ProductDraft>) => {
    setProductDraft((prev) => ({ ...prev, ...patch }));
    setProductDirty(true);
  };

  const patchCategoryDraft = (patch: Partial<CategoryDraft>) => {
    setCategoryDraft((prev) => {
      const next = { ...prev, ...patch };
      if (patch.name !== undefined && !editingCategory) {
        next.slug = slugify(patch.name);
      }
      return next;
    });
    setCategoryDirty(true);
  };

  const saveOptionGroups = async (productId: string, draft: ProductDraft) => {
    await fetch(`/api/products/${productId}/option-groups`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groups: draft.optionGroups.map((group, index) => ({
          name: group.name,
          required: group.required,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          sortOrder: index,
          options: group.options.map((option, optionIndex) => ({
            name: option.name,
            priceModifier: option.priceModifier,
            sortOrder: optionIndex,
          })),
        })),
      }),
    });
  };

  const saveProduct = async (silent = false) => {
    if (!productDraft.name.trim() || !productDraft.description.trim()) {
      push("Namn och beskrivning krävs.", "error");
      return;
    }
    if (!productDraft.price || Number(productDraft.price) < 0) {
      push("Ange ett giltigt pris.", "error");
      return;
    }

    setSaving(true);
    const payload = buildProductPayload(productDraft);

    try {
      if (editingProduct) {
        setCategories((prev) =>
          prev.map((category) => ({
            ...category,
            products: category.products.map((product) =>
              product.id === editingProduct.id
                ? {
                    ...product,
                    ...payload,
                    campaignPrice: payload.campaignPrice,
                    campaignStart: payload.campaignStart,
                    campaignEnd: payload.campaignEnd,
                    image: payload.image,
                  }
                : product
            ),
          }))
        );

        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        await saveOptionGroups(editingProduct.id, productDraft);
        if (!silent) push("Produkt sparad.");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created: AdminMenuProduct = await res.json();
        await saveOptionGroups(created.id, productDraft);
        if (!silent) push("Produkt skapad.");
        setProductSheetOpen(false);
      }

      setProductDirty(false);
      savedProductDraft.current = productDraft;
      await fetchMenu();
    } catch {
      await fetchMenu();
      push("Kunde inte spara produkten.", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryDraft.name.trim()) {
      push("Kategorinamn krävs.", "error");
      return;
    }

    setSaving(true);
    const payload = {
      name: categoryDraft.name.trim(),
      slug: categoryDraft.slug.trim() || slugify(categoryDraft.name),
      image: categoryDraft.image || null,
      icon: categoryDraft.icon || null,
      active: categoryDraft.active,
    };

    try {
      const res = editingCategory
        ? await fetch(`/api/categories/${editingCategory.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error();
      push(editingCategory ? "Kategori sparad." : "Kategori skapad.");
      setCategorySheetOpen(false);
      setCategoryDirty(false);
      await fetchMenu();
    } catch {
      push("Kunde inte spara kategorin.", "error");
    } finally {
      setSaving(false);
    }
  };

  const quickToggleProduct = async (
    product: AdminMenuProduct,
    field: "active" | "hidden" | "soldOut"
  ) => {
    const nextValue = !product[field];
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        products: category.products.map((item) =>
          item.id === product.id ? { ...item, [field]: nextValue } : item
        ),
      }))
    );

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      if (!res.ok) throw new Error();
      push("Uppdaterat.");
    } catch {
      await fetchMenu();
      push("Kunde inte uppdatera.", "error");
    }
  };

  const deleteProduct = async (product: AdminMenuProduct) => {
    if (!window.confirm(`Ta bort "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      push("Produkt borttagen.");
      closeProductSheet();
      await fetchMenu();
    } catch {
      push("Kunde inte ta bort produkten.", "error");
    }
  };

  const duplicateProduct = async (product: AdminMenuProduct) => {
    try {
      const res = await fetch(`/api/products/${product.id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      push("Produkt duplicerad.");
      await fetchMenu();
    } catch {
      push("Kunde inte duplicera.", "error");
    }
  };

  const deleteCategory = async (category: AdminMenuCategory) => {
    if (
      !window.confirm(
        `Ta bort kategorin "${category.name}" och alla produkter i den?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      push("Kategori borttagen.");
      await fetchMenu();
    } catch {
      push("Kunde inte ta bort kategorin.", "error");
    }
  };

  const persistCategoryOrder = async (next: AdminMenuCategory[]) => {
    setCategories(next);
    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-menu-reorder-mode": "enabled",
        },
        body: JSON.stringify({
          items: next.map((category, index) => ({
            id: category.id,
            sortOrder: index,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      push("Kategorier omordnade.", "info");
    } catch {
      await fetchMenu();
      push("Kunde inte spara ordning.", "error");
    }
  };

  const persistProductOrder = async (
    categoryId: string,
    products: AdminMenuProduct[]
  ) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, products } : category
      )
    );

    try {
      const res = await fetch("/api/products/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-menu-reorder-mode": "enabled",
        },
        body: JSON.stringify({
          items: products.map((product, index) => ({
            id: product.id,
            sortOrder: index,
            categoryId,
          })),
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      await fetchMenu();
      push("Kunde inte spara produktordning.", "error");
    }
  };

  const onCategoryDrop = (targetId: string) => {
    if (!dragId || dragKind !== "category" || dragId === targetId) return;
    const fromIndex = categories.findIndex((c) => c.id === dragId);
    const toIndex = categories.findIndex((c) => c.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...categories];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    void persistCategoryOrder(next);
    setDragKind(null);
    setDragId(null);
  };

  const onProductDrop = (categoryId: string, targetId: string) => {
    if (!dragId || dragKind !== "product") return;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const fromIndex = category.products.findIndex((p) => p.id === dragId);
    const toIndex = category.products.findIndex((p) => p.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const nextProducts = [...category.products];
    const [moved] = nextProducts.splice(fromIndex, 1);
    nextProducts.splice(toIndex, 0, moved);
    void persistProductOrder(categoryId, nextProducts);
    setDragKind(null);
    setDragId(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <AdminToastStack toasts={toasts} onDismiss={dismiss} />

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
            Menyhantering
          </p>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">Meny</h1>
          <p className="mt-2 text-sm text-white/50">
            Hantera kategorier, produkter, priser och tillval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReorderMode((value) => !value)}
            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
              reorderMode
                ? "border-[#b85c38]/40 bg-[#b85c38]/12 text-[#e8c4a8]"
                : "border-white/10 bg-white/5 text-white/70 hover:text-white"
            }`}
          >
            {reorderMode ? "Sortering på" : "Sortera"}
          </button>
          <button
            type="button"
            onClick={openCreateCategory}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white"
          >
            + Kategori
          </button>
          <button
            type="button"
            onClick={() => openCreateProduct()}
            className="rounded-2xl bg-[#b85c38] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#9e4e2f]"
          >
            + Produkt
          </button>
        </div>
      </header>

      <div className="mb-6 grid gap-3 rounded-2xl border border-white/8 bg-[#121212] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block sm:col-span-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Sök produkter…"
            className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#b85c38]/45"
          />
        </label>

        <select
          value={filters.categoryId}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
          }
          className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-3 text-sm text-white"
        >
          <option value="all">Alla kategorier</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={filters.availability}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              availability: e.target.value as MenuFilters["availability"],
            }))
          }
          className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-3 text-sm text-white"
        >
          <option value="all">All tillgänglighet</option>
          <option value="available">Tillgängliga</option>
          <option value="unavailable">Ej tillgängliga</option>
        </select>

        <select
          value={filters.soldOut}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              soldOut: e.target.value as MenuFilters["soldOut"],
            }))
          }
          className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-3 text-sm text-white sm:col-span-2 lg:col-span-1"
        >
          <option value="all">Alla lager</option>
          <option value="in_stock">I lager</option>
          <option value="sold">Slutsålda</option>
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-white/45">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-white/8 bg-[#141414] p-10 text-center">
          <p className="text-white/55">Inga kategorier ännu.</p>
          <button
            type="button"
            onClick={openCreateCategory}
            className="mt-4 rounded-2xl bg-[#b85c38] px-5 py-3 text-sm font-semibold text-white"
          >
            Skapa första kategorin
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const isCollapsed = collapsed[category.id] ?? false;
            return (
              <section
                key={category.id}
                className="overflow-hidden rounded-3xl border border-white/8 bg-[#141414]"
                onDragOver={(e) => {
                  if (reorderMode && dragKind === "category") e.preventDefault();
                }}
                onDrop={() => reorderMode && onCategoryDrop(category.id)}
              >
                <div className="flex items-center gap-3 border-b border-white/6 px-4 py-4 sm:px-5">
                  {reorderMode && (
                    <button
                      type="button"
                      draggable
                      onDragStart={() => {
                        setDragKind("category");
                        setDragId(category.id);
                      }}
                      className="cursor-grab text-white/35 active:cursor-grabbing"
                      aria-label="Flytta kategori"
                    >
                      <GripVertical size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleCollapsed(category.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="text-2xl" aria-hidden>
                      {category.icon || "📁"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate font-serif text-xl text-white">
                          {category.name}
                        </h2>
                        {!category.active && (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/40">
                            Dold
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40">
                        {category.products.length} produkter · ordning{" "}
                        {category.sortOrder + 1}
                      </p>
                    </div>
                    {isCollapsed ? (
                      <ChevronRight size={18} className="text-white/35" />
                    ) : (
                      <ChevronDown size={18} className="text-white/35" />
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditCategory(category)}
                      className="rounded-xl border border-white/10 p-2 text-white/55 hover:text-white"
                      aria-label="Redigera kategori"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateProduct(category.id)}
                      className="rounded-xl border border-[#b85c38]/30 bg-[#b85c38]/10 p-2 text-[#e8c4a8]"
                      aria-label="Lägg till produkt"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category)}
                      className="rounded-xl border border-red-500/20 p-2 text-red-300"
                      aria-label="Ta bort kategori"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="divide-y divide-white/5">
                    {category.products.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-white/40">
                        Inga produkter i denna kategori.
                      </p>
                    ) : (
                      category.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 px-4 py-3 sm:px-5"
                          onDragOver={(e) => {
                            if (reorderMode && dragKind === "product")
                              e.preventDefault();
                          }}
                          onDrop={() =>
                            reorderMode &&
                            onProductDrop(category.id, product.id)
                          }
                        >
                          {reorderMode && (
                            <button
                              type="button"
                              draggable
                              onDragStart={() => {
                                setDragKind("product");
                                setDragId(product.id);
                              }}
                              className="cursor-grab text-white/30 active:cursor-grabbing"
                              aria-label="Flytta produkt"
                            >
                              <GripVertical size={16} />
                            </button>
                          )}

                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0d0d0d]">
                            <ProductImage
                              src={product.image}
                              categorySlug={category.slug}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-white">
                                {product.name}
                              </p>
                              {product.isPopular && (
                                <Sparkles size={14} className="text-[#d4a574]" />
                              )}
                              {product.isNew && (
                                <span className="rounded-full bg-[#b85c38]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#e8c4a8]">
                                  Ny
                                </span>
                              )}
                              {product.isVegetarian && (
                                <Leaf size={14} className="text-emerald-300" />
                              )}
                              {product.isGlutenFree && (
                                <Wheat size={14} className="text-amber-200" />
                              )}
                              {product.spicyLevel > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[#e85d4c]">
                                  {Array.from({ length: product.spicyLevel }).map(
                                    (_, i) => (
                                      <Flame key={i} size={12} />
                                    )
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-white/45">
                              {product.description}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-[#d4a574]">
                                {product.campaignPrice ?? product.price} kr
                              </span>
                              {product.campaignPrice != null && (
                                <span className="text-white/35 line-through">
                                  {product.price} kr
                                </span>
                              )}
                              {!product.active && (
                                <span className="text-white/35">Ej tillgänglig</span>
                              )}
                              {product.hidden && (
                                <span className="text-white/35">Dold</span>
                              )}
                              {product.soldOut && (
                                <span className="text-amber-300/80">Slutsåld</span>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                quickToggleProduct(product, "active")
                              }
                              className="rounded-lg border border-white/10 p-2 text-white/55 hover:text-white"
                              aria-label="Växla tillgänglighet"
                            >
                              {product.active ? (
                                <Eye size={15} />
                              ) : (
                                <EyeOff size={15} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                quickToggleProduct(product, "soldOut")
                              }
                              className="rounded-lg border border-white/10 p-2 text-white/55 hover:text-white"
                              aria-label="Växla slutsåld"
                            >
                              <PackageX size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              className="rounded-lg border border-white/10 p-2 text-white/55 hover:text-white"
                              aria-label="Redigera"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateProduct(product)}
                              className="rounded-lg border border-white/10 p-2 text-white/55 hover:text-white"
                              aria-label="Duplicera"
                            >
                              <Copy size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ProductEditorSheet
        open={productSheetOpen}
        draft={productDraft}
        categories={categoryOptions}
        editingProduct={editingProduct}
        saving={saving}
        dirty={productDirty}
        onChange={patchProductDraft}
        onClose={closeProductSheet}
        onSave={() => saveProduct(false)}
        onAutosave={() => {
          if (editingProduct) void saveProduct(true);
        }}
        onDuplicate={
          editingProduct ? () => duplicateProduct(editingProduct) : undefined
        }
        onDelete={
          editingProduct ? () => deleteProduct(editingProduct) : undefined
        }
      />

      <CategoryEditorSheet
        open={categorySheetOpen}
        draft={categoryDraft}
        saving={saving}
        dirty={categoryDirty}
        editing={Boolean(editingCategory)}
        onChange={patchCategoryDraft}
        onClose={closeCategorySheet}
        onSave={saveCategory}
      />
    </div>
  );
}
