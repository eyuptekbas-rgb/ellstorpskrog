"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  PackageX,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  categoryId: string;
  active: boolean;
  soldOut: boolean;
  createdAt: string;
  category: Category;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  image: string;
  categoryId: string;
  active: boolean;
  soldOut: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  categoryId: "",
  active: true,
  soldOut: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchProducts = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      const url = query
        ? `/api/products?search=${encodeURIComponent(query)}`
        : "/api/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      setError("Kunde inte hämta produkter.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) {
      setCategories(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image ?? "",
      categoryId: product.categoryId,
      active: product.active,
      soldOut: product.soldOut,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setUploadError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Uppladdning misslyckades");
      }
      setForm((prev) => ({ ...prev, image: data.url as string }));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Kunde inte ladda upp bilden"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      image: form.image || null,
      categoryId: form.categoryId,
      active: form.active,
      soldOut: form.soldOut,
    };

    try {
      const res = editingId
        ? await fetch(`/api/products/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error();

      closeModal();
      await fetchProducts(search);
    } catch {
      setError("Kunde inte spara produkten.");
    } finally {
      setSaving(false);
    }
  };

  const toggleField = async (
    product: Product,
    field: "active" | "soldOut"
  ) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !product[field] }),
      });
      if (!res.ok) throw new Error();
      await fetchProducts(search);
    } catch {
      setError("Kunde inte uppdatera produkten.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Ta bort denna produkt permanent?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchProducts(search);
    } catch {
      setError("Kunde inte ta bort produkten.");
    }
  };

  return (
    <div className="px-5 py-8 pb-12">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif tracking-wide">Produkter</h1>
          <div className="w-16 h-[2px] bg-[#b85c38] rounded-full mt-3 mb-2" />
          <p className="text-white/60 text-sm">
            {products.length} produkter i databasen
          </p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 bg-[#b85c38] hover:bg-[#9e4e2f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Ny produkt
        </button>
      </div>

      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          type="search"
          placeholder="Sök produkter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38]/50 transition"
        />
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-center py-12">Laddar produkter…</p>
      ) : products.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-white/50">Inga produkter hittades</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4"
            >
              <div className="flex gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                  <ProductImage
                    src={product.image}
                    categorySlug={product.category.slug}
                    alt={product.name}
                    fill
                    thumbnail
                    className="object-cover"
                    sizes="56px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{product.name}</h2>
                      <p className="text-white/50 text-xs mt-0.5">
                        {product.category.name}
                      </p>
                    </div>
                    <span className="text-[#b85c38] font-semibold shrink-0">
                      {product.price} kr
                    </span>
                  </div>

                  <p className="text-white/50 text-sm mt-2 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {!product.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                        Inaktiv
                      </span>
                    )}
                    {product.soldOut && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        Slutsåld
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={() => openEdit(product)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <Pencil size={14} />
                  Redigera
                </button>
                <button
                  onClick={() => toggleField(product, "active")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  {product.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  {product.active ? "Inaktivera" : "Aktivera"}
                </button>
                <button
                  onClick={() => toggleField(product, "soldOut")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <PackageX size={14} />
                  {product.soldOut ? "I lager" : "Slutsåld"}
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition ml-auto"
                >
                  <Trash2 size={14} />
                  Ta bort
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={closeModal}
          />
          <div className="fixed inset-x-4 top-[5vh] bottom-[5vh] z-50 bg-[#1a1a1a] rounded-2xl border border-[#b85c38]/30 flex flex-col max-w-lg mx-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <h2 className="text-lg font-serif">
                {editingId ? "Redigera produkt" : "Ny produkt"}
              </h2>
              <button
                onClick={closeModal}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Namn</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  Beskrivning
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">
                    Pris (kr)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38]"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">
                    Kategori
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-2 block">
                  Produktbild (valfritt)
                </label>

                {form.image ? (
                  <div className="relative mb-3 overflow-hidden rounded-xl border border-white/10 bg-[#111]">
                    <div className="relative aspect-[16/10] w-full">
                      <ProductImage
                        src={form.image}
                        categorySlug={
                          categories.find((c) => c.id === form.categoryId)
                            ?.slug ?? "pizza"
                        }
                        alt="Förhandsgranskning"
                        fill
                        className="object-cover"
                        sizes="(max-width: 512px) 100vw, 512px"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white/80 transition hover:bg-black hover:text-white"
                      aria-label="Ta bort bild"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#111] text-white/30">
                    <div className="text-center">
                      <ImageIcon size={28} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Ingen bild uppladdad</p>
                    </div>
                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#b85c38]/40 bg-[#b85c38]/10 px-4 py-3 text-sm font-medium text-[#e8c4a8] transition hover:bg-[#b85c38]/20">
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Bearbetar bild…
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {form.image ? "Byt bild" : "Ladda upp bild"}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="mt-1.5 text-xs text-white/40">
                  JPEG, PNG eller WebP · max 5 MB · optimeras automatiskt
                </p>
                {uploadError && (
                  <p className="mt-2 text-xs text-red-400">{uploadError}</p>
                )}
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                    className="rounded"
                  />
                  Aktiv
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.soldOut}
                    onChange={(e) =>
                      setForm({ ...form, soldOut: e.target.checked })
                    }
                    className="rounded"
                  />
                  Slutsåld
                </label>
              </div>
              </div>

              <div className="shrink-0 px-5 py-4 border-t border-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 hover:text-white transition"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-60 text-white font-semibold transition"
                >
                  {saving ? "Sparar…" : "Spara"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
