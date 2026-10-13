"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Move, Unlink } from "lucide-react";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";
import type { AdminTableRow } from "@/lib/reservations/admin";
import {
  assignOrderToTable,
  getTableOrderAssignments,
  tableAdminNote,
} from "@/lib/rms/table-orders";
import {
  computeFloorTables,
  FLOOR_STATUS_COLORS,
  FLOOR_STATUS_LABELS,
  type FloorTable,
} from "@/lib/rms/table-floor";

const TableManagementPanel = dynamic(
  () => import("@/components/admin/reservations/TableManagementPanel"),
  { loading: () => null, ssr: false }
);

function TablesFloorClient() {
  const defaultPositions = [[0.1,0.12],[0.1,0.34],[0.1,0.56],[0.1,0.78],[0.82,0.12],[0.82,0.34],[0.42,0.7],[0.58,0.7]] as const;
  const [tables, setTables] = useState<AdminTableRow[]>([]);
  const [reservations, setReservations] = useState<
    { id: string; tableId: string | null; status: import("@prisma/client").ReservationStatus; guestName: string; date: string; time: string }[]
  >([]);
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [stats, setStats] = useState({
    totalTables: 0,
    totalCapacity: 0,
    occupiedTables: 0,
    availableTables: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [assignmentsVersion, setAssignmentsVersion] = useState(0);
  const floorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [labels, setLabels] = useState<{ id: string; label: string; positionX: number | null; positionY: number | null; orientation: "HORIZONTAL" | "VERTICAL" }[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const labelDrag = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const createLabel = async () => { const label = newLabel.trim(); if (!label) return; const response = await fetch("/api/admin/floor-labels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) }); if (response.ok) { const created = await response.json(); setLabels((items) => [...items, created]); setNewLabel(""); } };
  const updateLabel = async (id: string, patch: Record<string, string>) => { const response = await fetch(`/api/admin/floor-labels/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }); if (response.ok) setLabels((items) => items.map((item) => item.id === id ? { ...item, ...patch } as typeof item : item)); };
  const deleteLabel = async (id: string) => { const response = await fetch(`/api/admin/floor-labels/${id}`, { method: "DELETE" }); if (response.ok) setLabels((items) => items.filter((item) => item.id !== id)); };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, table: FloorTable, x: number, y: number) => {
    const rect = floorRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: table.id, offsetX: event.clientX - (rect.left + x * rect.width), offsetY: event.clientY - (rect.top + y * rect.height) };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const rect = floorRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left - drag.offsetX) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top - drag.offsetY) / rect.height));
    setDragPositions((positions) => ({ ...positions, [drag.id]: { x, y } }));
  };

  const handlePointerUp = async (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const position = drag && dragPositions[drag.id];
    if (!drag || !position) { dragRef.current = null; return; }
    dragRef.current = null;
    await fetch(`/api/admin/tables/${drag.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ positionX: position.x, positionY: position.y }) });
    await load();
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesRes, reservationsRes, ordersRes, labelsRes] = await Promise.all([
        fetch("/api/admin/tables"),
        fetch("/api/admin/reservations?range=today"),
        fetch("/api/orders?group=ACTIVE"),
        fetch("/api/admin/floor-labels"),
      ]);
      if (labelsRes.ok) setLabels(await labelsRes.json());
      if (tablesRes.ok) setTables(await tablesRes.json());
      if (reservationsRes.ok) {
        const data = await reservationsRes.json();
        setReservations(data.reservations ?? []);
        if (data.stats) setStats(data.stats);
      }
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orderCounts = useMemo(() => {
    void assignmentsVersion;
    const counts: Record<string, number> = {};
    for (const a of getTableOrderAssignments()) {
      counts[a.tableId] = (counts[a.tableId] ?? 0) + 1;
    }
    return counts;
  }, [assignmentsVersion]);

  const floorTables = useMemo(
    () => computeFloorTables(tables, reservations, orderCounts),
    [tables, reservations, orderCounts]
  );

  const createTable = async (name: string, capacity: number) => {
    setBusy(true);
    try {
      await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, capacity }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const mergeTables = async (tableIds: string[]) => {
    setBusy(true);
    try {
      await fetch("/api/admin/tables/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableIds }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const unmergeTable = async (table: FloorTable) => {
    if (!table.mergeGroupId) return;
    setBusy(true);
    try {
      const group = floorTables.filter((t) => t.mergeGroupId === table.mergeGroupId);
      await Promise.all(
        group.map((t) =>
          fetch(`/api/admin/tables/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mergeGroupId: null }),
          })
        )
      );
      await load();
    } finally {
      setBusy(false);
    }
  };

  const assignOrder = async (orderId: string, table: FloorTable) => {
    assignOrderToTable(orderId, table.id, table.name);
    setAssignmentsVersion((v) => v + 1);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: tableAdminNote(table.name) }),
    });
  };

  const moveTableReservation = async (from: FloorTable, to: FloorTable) => {
    const reservation = reservations.find((r) => r.tableId === from.id);
    if (!reservation) return;
    setBusy(true);
    try {
      await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: to.id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/45">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
          Bord
        </p>
        <h1 className="font-serif text-3xl text-white">Restaurant Floor</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["available", "occupied", "reserved"] as const).map((status) => (
          <div
            key={status}
            className="rounded-2xl border border-white/8 bg-[#141414] px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wider text-white/35">
              {FLOOR_STATUS_LABELS[status]}
            </p>
            <p className="mt-1 font-serif text-2xl text-white">
              {floorTables.filter((t) => t.floorStatus === status).length}
            </p>
          </div>
        ))}
        <div className="rounded-2xl border border-white/8 bg-[#141414] px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-white/35">Totalt</p>
          <p className="mt-1 font-serif text-2xl text-white">{floorTables.length}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="mb-4 font-serif text-xl text-white">Salong</h2>
        <div ref={floorRef} className="relative h-[520px] touch-none rounded-2xl border border-white/6 bg-[#0f0f0f] p-4">
          <div className="col-span-full grid grid-cols-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
            <span>Fönstersida</span><span className="text-right">Barsida</span>
          </div>
          {floorTables.slice(0, 8).map((table, index) => {
            const [dx, dy] = defaultPositions[index];
            const saved = dragPositions[table.id];
            const x = saved?.x ?? table.positionX ?? dx;
            const y = saved?.y ?? table.positionY ?? dy;
            return (
            <button
              key={table.id}
              type="button"
              onPointerDown={(event) => handlePointerDown(event, table, x, y)}
              onPointerMove={handlePointerMove}
              onPointerUp={(event) => void handlePointerUp(event)}
              onPointerCancel={(event) => void handlePointerUp(event)}
              onClick={() =>
                setSelectedTableId((id) => (id === table.id ? null : table.id))
              }
              style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-4 text-left transition ${
                FLOOR_STATUS_COLORS[table.floorStatus]
              } ${selectedTableId === table.id ? "ring-2 ring-[#b85c38]/50" : ""}`}
            >
              <p className="font-semibold text-white">{table.name}</p>
              <p className="mt-1 text-xs text-white/50">
                {table.capacity} platser · {FLOOR_STATUS_LABELS[table.floorStatus]}
              </p>
              {table.reservationGuest && (
                <p className="mt-2 truncate text-xs text-white/60">
                  {table.reservationGuest}
                </p>
              )}
              {(table.orderCount ?? 0) > 0 && (
                <p className="mt-1 text-xs text-[#d4a574]">
                  {table.orderCount} order(s)
                </p>
              )}
            </button>);
          })}
          {labels.map((label) => { const x = label.positionX ?? (label.label === "Entré" ? 0.5 : 0.75); const y = label.positionY ?? 0.08; return <span key={label.id} onPointerDown={(e) => { const r = floorRef.current?.getBoundingClientRect(); if (!r) return; e.currentTarget.setPointerCapture(e.pointerId); labelDrag.current = { id: label.id, ox: e.clientX - (r.left + x * r.width), oy: e.clientY - (r.top + y * r.height) }; }} onPointerMove={(e) => { const d = labelDrag.current, r = floorRef.current?.getBoundingClientRect(); if (!d || !r) return; const nx = Math.max(0, Math.min(1, (e.clientX - r.left - d.ox) / r.width)), ny = Math.max(0, Math.min(1, (e.clientY - r.top - d.oy) / r.height)); setLabels((ls) => ls.map((l) => l.id === d.id ? { ...l, positionX: nx, positionY: ny } : l)); }} onPointerUp={() => { const d = labelDrag.current, l = labels.find((v) => v.id === d?.id); labelDrag.current = null; if (l?.positionX != null && l.positionY != null) void fetch(`/api/admin/floor-labels/${l.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ positionX: l.positionX, positionY: l.positionY }) }); }} className="absolute z-10 cursor-move rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-3 py-1 text-xs uppercase tracking-wider text-[#e8c4a8]" style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: "translate(-50%, -50%)" }}>{label.label}</span>; })}
          <div className="pointer-events-none absolute inset-y-12 left-1/2 hidden -translate-x-1/2 border-l border-dashed border-white/10 sm:block">
            Gång · Bord 7 + 8 kan slås ihop
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-white/8 pt-4">
          <p className="text-xs uppercase tracking-wider text-white/35">Golvetiketter</p>
          <div className="flex gap-2"><input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="Ny etikett" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /><button type="button" onClick={() => void createLabel()} className="rounded-xl bg-[#b85c38] px-3 py-2 text-sm text-white">Lägg till</button></div>
          {labels.map((label) => <div key={label.id} className="flex flex-wrap items-center gap-2"><input value={label.label} onChange={(event) => setLabels((items) => items.map((item) => item.id === label.id ? { ...item, label: event.target.value } : item))} onBlur={() => void updateLabel(label.id, { label: label.label })} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white" /><select value={label.orientation} onChange={(event) => void updateLabel(label.id, { orientation: event.target.value })} className="rounded-lg border border-white/10 bg-[#171717] px-2 py-1 text-sm text-white"><option value="HORIZONTAL">Horisontell</option><option value="VERTICAL">Vertikal</option></select><button type="button" onClick={() => void deleteLabel(label.id)} className="rounded-lg border border-red-400/30 px-2 py-1 text-sm text-red-200">Ta bort</button></div>)}
        </div>

        {selectedTableId && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
            {(() => {
              const table = floorTables.find((t) => t.id === selectedTableId);
              if (!table) return null;
              return (
                <>
                  {table.mergeGroupId && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void unmergeTable(table)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70"
                    >
                      <Unlink size={16} />
                      Dela upp
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMoveTargetId(table.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70"
                  >
                    <Move size={16} />
                    Flytta bord
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {moveTargetId && (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
            <p className="text-sm text-amber-100">Välj målbord att flytta till:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {floorTables
                .filter((t) => t.id !== moveTargetId)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const from = floorTables.find((x) => x.id === moveTargetId);
                      if (from) void moveTableReservation(from, t);
                      setMoveTargetId(null);
                    }}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white"
                  >
                    {t.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="font-serif text-xl text-white">Tilldela order till bord</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            {orders.slice(0, 8).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-[#0f0f0f] px-4 py-3 text-sm"
              >
                <span className="text-white">
                  {order.orderNumber} · {order.customerName}
                </span>
                {selectedTableId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const table = floorTables.find((t) => t.id === selectedTableId);
                      if (table) void assignOrder(order.id, table);
                    }}
                    className="rounded-lg bg-[#b85c38]/20 px-3 py-1 text-xs font-semibold text-[#e8c4a8]"
                  >
                    Tilldela
                  </button>
                ) : (
                  <span className="text-xs text-white/35">Välj bord</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <TableManagementPanel
        tables={tables}
        stats={stats}
        onCreate={createTable}
        onMerge={mergeTables}
        busy={busy}
      />
    </div>
  );
}

export default memo(TablesFloorClient);
