"use client";

import { useState } from "react";
import { Link2, Plus, Sofa } from "lucide-react";
import {
  groupTablesByMerge,
  mergedTableCapacity,
  mergedTableLabel,
  type AdminTableRow,
} from "@/lib/reservations/admin";

type Props = {
  tables: AdminTableRow[];
  stats: {
    totalCapacity: number;
    totalTables: number;
    occupiedTables: number;
    availableTables: number;
  };
  onCreate: (name: string, capacity: number) => Promise<void>;
  onMerge: (tableIds: string[]) => Promise<void>;
  busy?: boolean;
};

export default function TableManagementPanel({
  tables,
  stats,
  onCreate,
  onMerge,
  busy,
}: Props) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const groups = groupTablesByMerge(tables.filter((t) => t.active));

  const occupancyPct =
    stats.totalTables > 0
      ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
      : 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cap = Number(capacity);
    if (!name.trim() || !Number.isFinite(cap)) return;
    await onCreate(name.trim(), cap);
    setName("");
    setCapacity("4");
  };

  const handleMerge = async () => {
    if (selected.size < 2) return;
    await onMerge([...selected]);
    setSelected(new Set());
  };

  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-white">Bordshantering</h2>
          <p className="mt-0.5 text-sm text-white/45">
            {stats.totalTables} bord · {stats.totalCapacity} platser · {occupancyPct}% belagt
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b85c38]/12 text-[#d4a574]">
          <Sofa size={18} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <div className="rounded-2xl border border-white/6 bg-[#121212] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Totalt</p>
          <p className="mt-1 font-serif text-lg text-white">{stats.totalTables}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-[#121212] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Lediga</p>
          <p className="mt-1 font-serif text-lg text-emerald-300">{stats.availableTables}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-[#121212] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Upptagna</p>
          <p className="mt-1 font-serif text-lg text-blue-300">{stats.occupiedTables}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-[#121212] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Kapacitet</p>
          <p className="mt-1 font-serif text-lg text-[#e8c4a8]">{stats.totalCapacity}</p>
        </div>
      </div>

      <form onSubmit={(e) => void handleCreate(e)} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Bordnamn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#b85c38]/40 focus:outline-none"
        />
        <input
          type="number"
          min={1}
          max={50}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white sm:w-24"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b85c38] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c96a45] disabled:opacity-50"
        >
          <Plus size={16} />
          Lägg till
        </button>
      </form>

      {selected.size >= 2 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleMerge()}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#b85c38]/30 bg-[#b85c38]/10 px-4 py-2.5 text-sm font-medium text-[#e8c4a8] transition hover:bg-[#b85c38]/20 disabled:opacity-50"
        >
          <Link2 size={16} />
          Slå ihop {selected.size} bord
        </button>
      )}

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-sm text-white/40">
          Inga bord ännu — lägg till ditt första bord ovan.
        </p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const primary = group[0];
            const label = group.length > 1 ? mergedTableLabel(group) : primary.name;
            const cap = mergedTableCapacity(group);
            const isSelected = selected.has(primary.id);

            return (
              <li key={primary.mergeGroupId ?? primary.id}>
                <button
                  type="button"
                  onClick={() => toggleSelect(primary.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-[#b85c38]/40 bg-[#b85c38]/10"
                      : "border-white/6 bg-[#121212] hover:border-white/12"
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{label}</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {cap} platser
                      {group.length > 1 ? " · sammanslaget" : ""}
                    </p>
                  </div>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      isSelected
                        ? "border-[#b85c38] bg-[#b85c38]"
                        : "border-white/20 bg-transparent"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
