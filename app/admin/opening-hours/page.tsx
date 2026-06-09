"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { DAY_NAMES } from "@/lib/settings/utils";

type HourRow = {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export default function AdminOpeningHoursPage() {
  const [hours, setHours] = useState<HourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchHours = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/opening-hours");
      if (!res.ok) throw new Error();
      setHours(await res.json());
    } catch {
      setError("Kunde inte hämta öppettider.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  const updateRow = (dayOfWeek: number, patch: Partial<HourRow>) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/opening-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (!res.ok) throw new Error();
      setHours(await res.json());
      setSaved(true);
    } catch {
      setError("Kunde inte spara öppettider.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-[#111] border border-[#b85c38]/30 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-[#b85c38] transition disabled:opacity-40";

  return (
    <div className="px-5 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-serif">Öppettider</h1>
        <p className="text-white/50 text-sm mt-1">
          Ställ in öppettider för varje veckodag
        </p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 text-green-300 text-sm">
          Öppettiderna har sparats.
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">Laddar…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 text-xs text-white/40 border-b border-white/5">
              <span>Dag</span>
              <span className="w-28 text-center">Öppnar</span>
              <span className="w-28 text-center">Stänger</span>
              <span className="w-20 text-center">Stängt</span>
            </div>

            {hours.map((row) => (
              <div
                key={row.dayOfWeek}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-white/5 last:border-0"
              >
                <span className="font-medium text-sm">
                  {DAY_NAMES[row.dayOfWeek]}
                </span>

                <input
                  type="time"
                  value={row.openTime}
                  disabled={row.isClosed}
                  onChange={(e) =>
                    updateRow(row.dayOfWeek, { openTime: e.target.value })
                  }
                  className={`${inputClass} w-28`}
                />

                <input
                  type="time"
                  value={row.closeTime}
                  disabled={row.isClosed}
                  onChange={(e) =>
                    updateRow(row.dayOfWeek, { closeTime: e.target.value })
                  }
                  className={`${inputClass} w-28`}
                />

                <label className="flex justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.isClosed}
                    onChange={(e) =>
                      updateRow(row.dayOfWeek, { isClosed: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#b85c38]"
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition"
          >
            <Save size={18} />
            {saving ? "Sparar…" : "Spara öppettider"}
          </button>
        </form>
      )}
    </div>
  );
}
