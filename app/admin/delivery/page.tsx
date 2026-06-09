"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type DeliveryZone = {
  id: string;
  name: string;
  postalCodes: string;
  deliveryFee: number;
  minimumOrder: number;
};

type ZoneForm = {
  name: string;
  postalCodes: string;
  deliveryFee: number;
  minimumOrder: number;
};

const emptyForm: ZoneForm = {
  name: "",
  postalCodes: "",
  deliveryFee: 49,
  minimumOrder: 0,
};

export default function AdminDeliveryPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/delivery-zones");
      if (!res.ok) throw new Error();
      setZones(await res.json());
    } catch {
      setError("Kunde inte hämta leveranszoner.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setForm({
      name: zone.name,
      postalCodes: zone.postalCodes,
      deliveryFee: zone.deliveryFee,
      minimumOrder: zone.minimumOrder,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = editingId
        ? await fetch(`/api/delivery-zones/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/delivery-zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });

      if (!res.ok) throw new Error();
      closeModal();
      await fetchZones();
    } catch {
      setError("Kunde inte spara leveranszon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ta bort denna leveranszon?")) return;
    setError("");

    try {
      const res = await fetch(`/api/delivery-zones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchZones();
    } catch {
      setError("Kunde inte ta bort leveranszon.");
    }
  };

  const inputClass =
    "w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38] transition";

  return (
    <div className="px-5 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Leverans</h1>
          <p className="text-white/50 text-sm mt-1">
            Zoner med postnummer, avgift och minsta order
          </p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-2 bg-[#b85c38] hover:bg-[#9e4e2f] text-white text-sm font-medium px-4 py-2.5 rounded-full transition"
        >
          <Plus size={16} />
          Ny zon
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">Laddar…</p>
      ) : zones.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-8 text-center text-white/50 text-sm">
          Inga leveranszoner ännu. Standardavgift från inställningar används.
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex items-start justify-between gap-4"
            >
              <div>
                <p className="font-medium">{zone.name}</p>
                <p className="text-white/50 text-sm mt-1">
                  Postnummer: {zone.postalCodes}
                </p>
                <p className="text-white/40 text-xs mt-2">
                  Avgift {zone.deliveryFee} kr · Minsta order {zone.minimumOrder} kr
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(zone)}
                  className="p-2 rounded-xl bg-[#111] border border-white/5 hover:border-[#b85c38]/40 transition"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="p-2 rounded-xl bg-[#111] border border-white/5 hover:border-red-500/40 text-red-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl p-6 border border-[#b85c38]/40 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif">
                {editingId ? "Redigera zon" : "Ny leveranszon"}
              </h2>
              <button onClick={closeModal} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Namn</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  Postnummer (kommaseparerade)
                </label>
                <input
                  value={form.postalCodes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, postalCodes: e.target.value }))
                  }
                  placeholder="21218, 21219, 21220"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">
                    Leveransavgift (kr)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.deliveryFee}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        deliveryFee: Number(e.target.value) || 0,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">
                    Minsta order (kr)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minimumOrder}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        minimumOrder: Number(e.target.value) || 0,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition"
              >
                {saving ? "Sparar…" : "Spara"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
