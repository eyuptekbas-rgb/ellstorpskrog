"use client";

import { Loader2, Save, X } from "lucide-react";
import type { CategoryDraft } from "@/lib/admin/menu-types";

type Props = {
  open: boolean;
  draft: CategoryDraft;
  saving: boolean;
  dirty: boolean;
  editing: boolean;
  onChange: (patch: Partial<CategoryDraft>) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function CategoryEditorSheet({
  open,
  draft,
  saving,
  dirty,
  editing,
  onChange,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-[#b85c38]/20 bg-[#111] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-editor-title"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#d4a574]">
              {editing ? "Redigera kategori" : "Ny kategori"}
            </p>
            <h2 id="category-editor-title" className="font-serif text-2xl text-white">
              {draft.name || "Kategori"}
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
            Namn
            <input
              value={draft.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
            Slug
            <input
              value={draft.slug}
              onChange={(e) => onChange({ slug: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
            Ikon (emoji)
            <input
              value={draft.icon}
              onChange={(e) => onChange({ icon: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-2xl text-white outline-none focus:border-[#b85c38]/50"
              placeholder="🍕"
              maxLength={4}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-white/45">
            Bild-URL
            <input
              value={draft.image}
              onChange={(e) => onChange({ image: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#b85c38]/50"
              placeholder="https://…"
            />
          </label>

          <button
            type="button"
            onClick={() => onChange({ active: !draft.active })}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
              draft.active
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-white/55"
            }`}
          >
            {draft.active ? "Synlig i menyn" : "Dold i menyn"}
          </button>
        </div>

        <div className="border-t border-white/8 px-5 py-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#b85c38] py-3.5 text-sm font-semibold text-white hover:bg-[#9e4e2f] disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "Sparar…" : editing ? "Spara kategori" : "Skapa kategori"}
          </button>
        </div>
      </aside>
    </>
  );
}
