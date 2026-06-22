"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Flame,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import type { AdminMenuProduct, ProductDraft } from "@/lib/admin/menu-types";
import ImageCropModal from "./ImageCropModal";

type Props = {
  open: boolean;
  draft: ProductDraft;
  categories: Array<{ id: string; name: string }>;
  editingProduct: AdminMenuProduct | null;
  saving: boolean;
  dirty: boolean;
  onChange: (patch: Partial<ProductDraft>) => void;
  onClose: () => void;
  onSave: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAutosave: () => void;
};

function ChiliIcons({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Styrka ${level}`}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Flame
          key={index}
          size={14}
          className={index < level ? "text-[#e85d4c]" : "text-white/20"}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default function ProductEditorSheet({
  open,
  draft,
  categories,
  editingProduct,
  saving,
  dirty,
  onChange,
  onClose,
  onSave,
  onDuplicate,
  onDelete,
  onAutosave,
}: Props) {
  const [cropFile, setCropFile] = useState<File | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || !dirty || !editingProduct) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      onAutosave();
    }, 1400);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [open, dirty, editingProduct, draft, onAutosave]);

  const addOptionGroup = () => {
    onChange({
      optionGroups: [
        ...draft.optionGroups,
        {
          id: `new-${Date.now()}`,
          name: "Ny grupp",
          required: false,
          minSelect: 0,
          maxSelect: 1,
          sortOrder: draft.optionGroups.length,
          options: [],
        },
      ],
    });
  };

  const updateGroup = (
    groupId: string,
    patch: Partial<(typeof draft.optionGroups)[number]>
  ) => {
    onChange({
      optionGroups: draft.optionGroups.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group
      ),
    });
  };

  const removeGroup = (groupId: string) => {
    onChange({
      optionGroups: draft.optionGroups.filter((group) => group.id !== groupId),
    });
  };

  const addOption = (groupId: string) => {
    onChange({
      optionGroups: draft.optionGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                {
                  id: `new-${Date.now()}`,
                  name: "",
                  priceModifier: 0,
                  sortOrder: group.options.length,
                },
              ],
            }
          : group
      ),
    });
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    patch: Partial<(typeof draft.optionGroups)[number]["options"][number]>
  ) => {
    onChange({
      optionGroups: draft.optionGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option
              ),
            }
          : group
      ),
    });
  };

  const removeOption = (groupId: string, optionId: string) => {
    onChange({
      optionGroups: draft.optionGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter((option) => option.id !== optionId),
            }
          : group
      ),
    });
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-xl flex-col border-l border-[#b85c38]/20 bg-[#111] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#d4a574]">
              {editingProduct ? "Redigera produkt" : "Ny produkt"}
            </p>
            <h2 id="product-editor-title" className="font-serif text-2xl text-white">
              {draft.name || "Produkt"}
            </h2>
            {dirty && (
              <p className="mt-1 text-xs text-amber-300/80">Osparade ändringar</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:text-white"
            aria-label="Stäng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          <section className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Titel
              <input
                value={draft.name}
                onChange={(e) => onChange({ name: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
                placeholder="Produktnamn"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Beskrivning
              <textarea
                value={draft.description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
                placeholder="Kort beskrivning för menyn"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Ingredienser
              <textarea
                value={draft.ingredients}
                onChange={(e) => onChange({ ingredients: e.target.value })}
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
                placeholder="t.ex. tomatsås, mozzarella, basilika"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Allergener
              <textarea
                value={draft.allergens}
                onChange={(e) => onChange({ allergens: e.target.value })}
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
                placeholder="t.ex. gluten, mjölk, nötter"
              />
            </label>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Pris (kr)
              <input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => onChange({ price: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Kampanjpris
              <input
                type="number"
                min={0}
                value={draft.campaignPrice}
                onChange={(e) => onChange({ campaignPrice: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
                placeholder="Valfritt"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Kampanj start
              <input
                type="date"
                value={draft.campaignStart}
                onChange={(e) => onChange({ campaignStart: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Kampanj slut
              <input
                type="date"
                value={draft.campaignEnd}
                onChange={(e) => onChange({ campaignEnd: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
              />
            </label>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
              Bild
            </p>
            <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#0d0d0d] p-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#1a1a1a]">
                {draft.image ? (
                  <ProductImage
                    src={draft.image}
                    categorySlug="pizza"
                    alt={draft.name || "Produkt"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/25">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#b85c38]/35 bg-[#b85c38]/10 px-3 py-2 text-xs font-semibold text-[#e8c4a8]">
                  <Upload size={14} />
                  Ladda upp
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCropFile(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {draft.image && (
                  <button
                    type="button"
                    onClick={() => onChange({ image: "" })}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/55 hover:text-white"
                  >
                    Ta bort
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
              Kategori
              <select
                value={draft.categoryId}
                onChange={(e) => onChange({ categoryId: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { key: "active", label: "Tillgänglig" },
                { key: "hidden", label: "Dold" },
                { key: "soldOut", label: "Slutsåld" },
                { key: "isPopular", label: "Populär" },
                { key: "isNew", label: "Nyhet" },
                { key: "isVegetarian", label: "Vegetarisk" },
                { key: "isGlutenFree", label: "Glutenfri" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    onChange({
                      [key]: !draft[key as keyof ProductDraft],
                    } as Partial<ProductDraft>)
                  }
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    draft[key as keyof ProductDraft]
                      ? "border-[#b85c38]/40 bg-[#b85c38]/12 text-[#e8c4a8]"
                      : "border-white/8 bg-[#0d0d0d] text-white/55"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#0d0d0d] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">
                  Styrka
                </span>
                <ChiliIcons level={draft.spicyLevel} />
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={draft.spicyLevel}
                onChange={(e) =>
                  onChange({ spicyLevel: Number(e.target.value) })
                }
                className="mt-3 w-full accent-[#b85c38]"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                Tillval & grupper
              </p>
              <button
                type="button"
                onClick={addOptionGroup}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white"
              >
                <Plus size={14} />
                Grupp
              </button>
            </div>

            {draft.optionGroups.map((group) => (
              <div
                key={group.id}
                className="space-y-3 rounded-2xl border border-white/8 bg-[#0d0d0d] p-4"
              >
                <div className="flex items-start gap-2">
                  <input
                    value={group.name}
                    onChange={(e) =>
                      updateGroup(group.id, { name: e.target.value })
                    }
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white"
                    placeholder="Gruppnamn"
                  />
                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="rounded-lg border border-red-500/20 p-2 text-red-300"
                    aria-label="Ta bort grupp"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="space-y-1 text-white/45">
                    Min
                    <input
                      type="number"
                      min={0}
                      value={group.minSelect}
                      onChange={(e) =>
                        updateGroup(group.id, {
                          minSelect: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white"
                    />
                  </label>
                  <label className="space-y-1 text-white/45">
                    Max
                    <input
                      type="number"
                      min={1}
                      value={group.maxSelect}
                      onChange={(e) =>
                        updateGroup(group.id, {
                          maxSelect: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateGroup(group.id, { required: !group.required })
                    }
                    className={`self-end rounded-lg border px-2 py-1.5 font-semibold ${
                      group.required
                        ? "border-[#b85c38]/40 bg-[#b85c38]/12 text-[#e8c4a8]"
                        : "border-white/10 text-white/55"
                    }`}
                  >
                    {group.required ? "Obligatorisk" : "Valfri"}
                  </button>
                </div>

                <div className="space-y-2">
                  {group.options.map((option) => (
                    <div key={option.id} className="flex gap-2">
                      <input
                        value={option.name}
                        onChange={(e) =>
                          updateOption(group.id, option.id, {
                            name: e.target.value,
                          })
                        }
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white"
                        placeholder="Alternativ"
                      />
                      <input
                        type="number"
                        value={option.priceModifier}
                        onChange={(e) =>
                          updateOption(group.id, option.id, {
                            priceModifier: Number(e.target.value),
                          })
                        }
                        className="w-20 rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-2 text-sm text-white"
                        aria-label="Pris"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(group.id, option.id)}
                        className="rounded-lg border border-white/10 px-2 text-white/45"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(group.id)}
                    className="text-xs font-semibold text-[#d4a574]"
                  >
                    + Lägg till alternativ
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-2 border-t border-white/8 px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#b85c38] py-3.5 text-sm font-semibold text-white hover:bg-[#9e4e2f] disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "Sparar…" : editingProduct ? "Spara produkt" : "Skapa produkt"}
          </button>

          {editingProduct && (
            <div className="grid grid-cols-2 gap-2">
              {onDuplicate && (
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/75 hover:text-white"
                >
                  <Copy size={16} />
                  Duplicera
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 py-3 text-sm font-semibold text-red-200"
                >
                  <Trash2 size={16} />
                  Ta bort
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <ImageCropModal
        open={Boolean(cropFile)}
        file={cropFile}
        onClose={() => setCropFile(null)}
        onUploaded={(url) => onChange({ image: url })}
      />
    </>
  );
}
