"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Pencil, Plus, Trash2, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

type ExtraOption = {
  id: string;
  name: string;
  priceModifier: number;
  sortOrder: number;
  active: boolean;
  categoryIds: string[];
  categories: Array<{ id: string; name: string; slug: string }>;
};

type ExtraForm = {
  name: string;
  priceModifier: string;
  categoryIds: string[];
};

const emptyForm: ExtraForm = {
  name: "",
  priceModifier: "0",
  categoryIds: [],
};

export default function AdminExtrasPage() {
  const [extras, setExtras] = useState<ExtraOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExtraForm>(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [extrasRes, categoriesRes] = await Promise.all([
        fetch("/api/extra-options"),
        fetch("/api/categories?admin=true"),
      ]);
      if (!extrasRes.ok || !categoriesRes.ok) throw new Error();
      setExtras(await extrasRes.json());
      setCategories(await categoriesRes.json());
    } catch {
      setError("Kunde inte hämta tillbehör.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.active),
    [categories]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (extra: ExtraOption) => {
    setEditingId(extra.id);
    setForm({
      name: extra.name,
      priceModifier: extra.priceModifier.toString(),
      categoryIds: extra.categoryIds,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleCategory = (categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      priceModifier: Number(form.priceModifier) || 0,
      categoryIds: form.categoryIds,
    };

    try {
      const res = editingId
        ? await fetch(`/api/extra-options/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/extra-options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error();

      closeModal();
      await fetchData();
    } catch {
      setError("Kunde inte spara tillbehöret.");
    } finally {
      setSaving(false);
    }
  };

  const deleteExtra = async (extra: ExtraOption) => {
    if (!confirm(`Ta bort "${extra.name}"?`)) return;

    try {
      const res = await fetch(`/api/extra-options/${extra.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      await fetchData();
    } catch {
      setError("Kunde inte ta bort tillbehöret.");
    }
  };

  return (
    <div className="px-5 py-8 pb-12">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif tracking-wide">Tillbehör</h1>
          <div className="w-16 h-[2px] bg-[#b85c38] rounded-full mt-3 mb-2" />
          <p className="text-white/60 text-sm max-w-xl">
            Skapa tillbehör en gång och välj vilka kategorier de ska gälla för.
            Alla produkter i kategorin får samma val automatiskt.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 bg-[#b85c38] hover:bg-[#9e4e2f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Nytt tillbehör
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-center py-12">Laddar tillbehör…</p>
      ) : extras.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-white/50 mb-2">Inga tillbehör ännu</p>
          <p className="text-white/35 text-sm">
            T.ex. Extra ost, Bacon eller Glutenfri botten
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {extras.map((extra) => (
            <article
              key={extra.id}
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-lg">{extra.name}</h2>
                    <span className="text-sm font-semibold text-[#b85c38]">
                      {extra.priceModifier > 0
                        ? `+${extra.priceModifier} kr`
                        : "Gratis"}
                    </span>
                  </div>

                  {extra.categories.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {extra.categories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#b85c38]/12 px-3 py-1 text-xs font-medium text-[#e8c4a8]"
                        >
                          <Layers size={12} />
                          {category.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-white/35">
                      Inte kopplad till någon kategori ännu
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(extra)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                  >
                    <Pencil size={14} />
                    Redigera
                  </button>
                  <button
                    onClick={() => deleteExtra(extra)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition"
                  >
                    <Trash2 size={14} />
                    Ta bort
                  </button>
                </div>
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
                {editingId ? "Redigera tillbehör" : "Nytt tillbehör"}
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
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Namn</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="T.ex. Extra ost"
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38]"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1 block">
                    Pris (kr)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.priceModifier}
                    onChange={(e) =>
                      setForm({ ...form, priceModifier: e.target.value })
                    }
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#b85c38]"
                  />
                  <p className="mt-1 text-xs text-white/35">
                    Sätt 0 kr om tillbehöret ska vara gratis
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-1">
                    Gäller för kategorier
                  </p>
                  <p className="text-xs text-white/35 mb-3">
                    Välj vilka kategorier som ska erbjuda detta tillbehör
                  </p>

                  {activeCategories.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 bg-[#111] px-4 py-5 text-sm text-white/35">
                      Skapa en kategori först under Kategorier
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {activeCategories.map((category) => {
                        const checked = form.categoryIds.includes(category.id);
                        return (
                          <label
                            key={category.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                              checked
                                ? "border-[#b85c38]/50 bg-[#b85c38]/10"
                                : "border-white/8 bg-[#111] hover:border-white/15"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(category.id)}
                              className="rounded"
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
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
