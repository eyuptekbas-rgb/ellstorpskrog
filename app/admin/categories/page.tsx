"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { slugify } from "@/lib/categories";

type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  _count: { products: number };
};

type CategoryForm = {
  name: string;
  slug: string;
  image: string;
  active: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  image: "",
  active: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories?admin=true");
      if (!res.ok) throw new Error();
      setCategories(await res.json());
    } catch {
      setError("Kunde inte hämta kategorier.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      image: category.image ?? "",
      active: category.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      slug: form.slug,
      image: form.image || null,
      active: form.active,
    };

    try {
      const res = editingId
        ? await fetch(`/api/categories/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      closeModal();
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte spara kategorin."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !category.active }),
      });
      if (!res.ok) throw new Error();
      await fetchCategories();
    } catch {
      setError("Kunde inte uppdatera kategorin.");
    }
  };

  const deleteCategory = async (category: Category) => {
    const msg =
      category._count.products > 0
        ? `Ta bort "${category.name}" och alla ${category._count.products} produkter?`
        : `Ta bort kategorin "${category.name}"?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      await fetchCategories();
    } catch {
      setError("Kunde inte ta bort kategorin.");
    }
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setCategories(reordered);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragIndex === null) return;
    setDragIndex(null);

    const items = categories.map((cat, index) => ({
      id: cat.id,
      sortOrder: index,
    }));

    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error();
      setCategories(await res.json());
    } catch {
      setError("Kunde inte spara ordningen.");
      await fetchCategories();
    }
  };

  return (
    <div className="px-5 py-8 pb-12">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif tracking-wide">Kategorier</h1>
          <div className="w-16 h-[2px] bg-[#b85c38] rounded-full mt-3 mb-2" />
          <p className="text-white/60 text-sm">
            {categories.length} kategorier · dra för att sortera
          </p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 bg-[#b85c38] hover:bg-[#9e4e2f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Ny kategori
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-center py-12">Laddar kategorier…</p>
      ) : categories.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-white/50">Inga kategorier ännu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category, index) => (
            <article
              key={category.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-[#1a1a1a] border rounded-2xl p-4 flex gap-3 items-center transition ${
                dragIndex === index
                  ? "border-[#b85c38] opacity-70"
                  : "border-white/5"
              }`}
            >
              <div className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 shrink-0">
                <GripVertical size={20} />
              </div>

              <div className="w-12 h-12 shrink-0 rounded-xl bg-[#111] overflow-hidden relative flex items-center justify-center">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <Layers size={18} className="text-white/30" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold">{category.name}</h2>
                  {!category.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                      Inaktiv
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-0.5">/{category.slug}</p>
                <p className="text-white/50 text-xs mt-1">
                  {category._count.products} produkter · ordning {index + 1}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(category)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                  title="Redigera"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => toggleActive(category)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                  title={category.active ? "Inaktivera" : "Aktivera"}
                >
                  {category.active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => deleteCategory(category)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition"
                  title="Ta bort"
                >
                  <Trash2 size={14} />
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
          <div className="fixed inset-x-4 top-[10vh] z-50 bg-[#1a1a1a] rounded-2xl border border-[#b85c38]/30 max-w-lg mx-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-lg font-serif">
                {editingId ? "Redigera kategori" : "Ny kategori"}
              </h2>
              <button
                onClick={closeModal}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Namn</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Slug</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: slugify(e.target.value) })
                  }
                  className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  Bild-URL (valfritt)
                </label>
                <input
                  type="url"
                  placeholder="https://… eller /uploads/kategori.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#b85c38]"
                />
              </div>

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

              <div className="flex gap-3 pt-2">
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
