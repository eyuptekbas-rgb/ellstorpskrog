"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Shield } from "lucide-react";

type AuditRow = {
  id: string;
  category: string;
  action: string;
  details: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string };
  target: { id: string; name: string; email: string } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  order: "Order",
  payment: "Betalning",
  refund: "Återbetalning",
  printer: "Skrivare",
  settings: "Inställningar",
  security: "Säkerhet",
  staff: "Personal",
  terminal: "Terminal",
};

function AuditLogClient() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { logs: AuditRow[] };
        setLogs(data.logs);
      }
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
          Compliance
        </p>
        <h1 className="font-serif text-3xl text-white">Auditlogg</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/45">
          Spårning av statusändringar, utskrifter, inställningar och säkerhetshändelser.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-white/60">
          Kategori
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="ml-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
          >
            <option value="">Alla</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Uppdatera
        </button>
      </div>

      <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        {logs.length === 0 ? (
          <p className="text-sm text-white/45">Inga loggposter hittades.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <article
                key={log.id}
                className="rounded-xl border border-white/6 bg-black/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-white/40">
                  <Shield size={12} />
                  {CATEGORY_LABELS[log.category] ?? log.category}
                  <span>·</span>
                  {new Date(log.createdAt).toLocaleString("sv-SE")}
                </div>
                <p className="mt-1 font-medium text-white">{log.action}</p>
                {log.details ? (
                  <p className="mt-1 text-sm text-white/55">{log.details}</p>
                ) : null}
                <p className="mt-2 text-xs text-white/35">
                  {log.actor.name} ({log.actor.email})
                  {log.target ? ` → ${log.target.name}` : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default memo(AuditLogClient);
