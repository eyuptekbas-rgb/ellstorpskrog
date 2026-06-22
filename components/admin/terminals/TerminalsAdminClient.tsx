"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Monitor, RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { TerminalRecord } from "@/lib/rms/terminal-store";
import {
  getOrCreateTerminalId,
  loadTerminalMeta,
  saveTerminalMeta,
  type TerminalMeta,
} from "@/lib/rms/terminal-client";

function TerminalsAdminClient() {
  const [terminals, setTerminals] = useState<TerminalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<TerminalMeta>(() => loadTerminalMeta());
  const localId = useMemo(() => getOrCreateTerminalId(), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/terminals");
      if (res.ok) {
        const data = (await res.json()) as { terminals: TerminalRecord[] };
        setTerminals(data.terminals);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const saveMeta = () => {
    saveTerminalMeta(meta);
    void refresh();
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
          Multi-terminal
        </p>
        <h1 className="font-serif text-3xl text-white">Terminaler</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/45">
          Varje POS- eller köksskärm skickar heartbeat och visas som online eller offline.
        </p>
      </div>

      <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">Denna enhet</h2>
        <p className="mt-1 text-sm text-white/45">ID: {localId}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(["name", "location", "kitchen"] as const).map((field) => (
            <label key={field} className="block text-sm text-white/60">
              {field === "name" ? "Namn" : field === "location" ? "Plats" : "Kök"}
              <input
                value={meta[field]}
                onChange={(e) => setMeta((prev) => ({ ...prev, [field]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={saveMeta}
          className="mt-4 rounded-xl bg-[#b85c38] px-4 py-2 text-sm font-semibold text-white"
        >
          Spara enhetsinfo
        </button>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Aktiva terminaler</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Uppdatera
          </button>
        </div>

        {terminals.length === 0 ? (
          <p className="text-sm text-white/45">Inga terminaler registrerade ännu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-white/45">
                <tr>
                  <th className="pb-3 pr-4">Namn</th>
                  <th className="pb-3 pr-4">Plats</th>
                  <th className="pb-3 pr-4">Kök</th>
                  <th className="pb-3 pr-4">Senast sedd</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {terminals.map((terminal) => (
                  <tr key={terminal.id} className="border-t border-white/6 text-white/85">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Monitor size={14} className="text-white/35" />
                        {terminal.name}
                        {terminal.id === localId ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase">
                            Denna
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{terminal.location}</td>
                    <td className="py-3 pr-4">{terminal.kitchen}</td>
                    <td className="py-3 pr-4">
                      {new Date(terminal.lastSeen).toLocaleString("sv-SE")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          terminal.online
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-white/10 text-white/45"
                        }`}
                      >
                        {terminal.online ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {terminal.online ? "Online" : "Offline"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default memo(TerminalsAdminClient);
