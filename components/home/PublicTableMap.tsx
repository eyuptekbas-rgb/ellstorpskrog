"use client";
import { useEffect, useState } from "react";
import { useReservation } from "@/components/ReservationProvider";
type Table = { id: string; name: string; capacity: number; positionX: number | null; positionY: number | null };
type Label = { id: string; label: string; positionX: number | null; positionY: number | null; orientation: "HORIZONTAL" | "VERTICAL" };

export default function PublicTableMap() {
  const [tables, setTables] = useState<Table[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const { openReservation } = useReservation();
  useEffect(() => { fetch("/api/public/tables").then((r) => r.ok ? r.json() : []).then(setTables); fetch("/api/public/floor-labels", { cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setLabels); }, []);
  return (
    <div className="card-premium rounded-[var(--radius-card)] p-5 text-left sm:p-6">
      <div className="relative h-[320px] grid gap-2 sm:h-[420px]">
        <div className="col-span-full grid grid-cols-2 text-[9px] uppercase tracking-[0.2em] text-white/35">
          <span>Fönstersida</span><span className="text-right">Barsida</span>
        </div>
        {tables.slice(0, 8).map((table, index) => (
          <button type="button" onClick={() => openReservation(table.id)} key={table.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left" style={{ left: `${(table.positionX ?? [0.1,0.1,0.1,0.1,0.82,0.82,0.42,0.58][index]) * 100}%`, top: `${(table.positionY ?? [0.12,0.34,0.56,0.78,0.42,0.58,0.42,0.58][index]) * 100}%` }}>
            <p className="text-sm font-semibold text-white">{table.name}</p>
            <p className="mt-1 text-xs text-white/50">{table.capacity} platser</p>
          </button>
        ))}
        {labels.map((label) => <span key={label.id} className="pointer-events-none absolute rounded-full border border-[#d4a574]/25 bg-[#d4a574]/10 px-2 py-1 text-[9px] uppercase tracking-wider text-[#e8c4a8]" style={{ left: `${(label.positionX ?? 0.5) * 100}%`, top: `${(label.positionY ?? 0.08) * 100}%`, transform: `translate(-50%, -50%) rotate(${label.orientation === "VERTICAL" ? 90 : 0}deg)` }}>{label.label}</span>)}
        <div className="pointer-events-none absolute inset-y-8 left-1/2 hidden -translate-x-1/2 border-l border-dashed border-white/10 sm:block">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] uppercase tracking-[0.18em] text-white/30">
            Gång
          </span>
        </div>
      </div>
    </div>
  );
}
