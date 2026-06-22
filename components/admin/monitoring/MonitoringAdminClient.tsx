"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Activity, Cpu, Loader2, RefreshCw, Wifi } from "lucide-react";

function MonitoringAdminClient() {
  const [data, setData] = useState<{
    diagnostics: { ready: boolean; health: { status: string } };
    runtime: {
      memory: { heapUsedMb: number; rssMb: number };
      uptimeSeconds: number;
      sseConnections: number;
      printQueueLength: number;
      offlineQueueLength: number;
      printerStatus: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/monitoring");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 10_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
            Monitoring
          </p>
          <h1 className="font-serif text-3xl text-white">Systemövervakning</h1>
        </div>
        <button type="button" onClick={() => void refresh()} className="rounded-xl border border-white/10 px-3 py-2">
          <RefreshCw size={16} />
        </button>
      </header>

      {loading && !data ? (
        <Loader2 className="animate-spin text-white/40" />
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Activity}
              label="Health"
              value={data.diagnostics.health.status}
            />
            <MetricCard
              icon={Cpu}
              label="Heap"
              value={`${data.runtime.memory.heapUsedMb} MB`}
            />
            <MetricCard
              icon={Wifi}
              label="SSE"
              value={String(data.runtime.sseConnections)}
            />
            <MetricCard
              label="Uptime"
              value={`${Math.floor(data.runtime.uptimeSeconds / 60)} min`}
            />
          </div>
          <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-sm text-white/70">
            <p>RSS: {data.runtime.memory.rssMb} MB</p>
            <p>Print queue: {data.runtime.printQueueLength}</p>
            <p>Offline queue: {data.runtime.offlineQueueLength}</p>
            <p>Printer status: {data.runtime.printerStatus}</p>
            <p className="mt-2">
              Deployment ready: {data.diagnostics.ready ? "Yes" : "No"}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-white/40">
        {Icon ? <Icon size={14} /> : null}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default memo(MonitoringAdminClient);
