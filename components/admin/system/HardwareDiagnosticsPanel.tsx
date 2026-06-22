"use client";

import { useCallback, useState } from "react";
import { Cpu, HardDrive, RefreshCw, Wifi } from "lucide-react";
import type { HardwareDiagnostics } from "@/lib/system/hardware-diagnostics";

export default function HardwareDiagnosticsPanel({
  hardware,
  loading,
}: {
  hardware: HardwareDiagnostics | null;
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Cpu size={20} className="text-[#d4a574]" />
        <div>
          <h2 className="font-serif text-xl text-white">Hårdvara & drift</h2>
          <p className="text-sm text-white/45">
            CPU, minne, realtime, terminaler och version
          </p>
        </div>
      </div>

      {loading || !hardware ? (
        <p className="text-sm text-white/40">Laddar diagnostik…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={Cpu}
            label="CPU"
            value={`${hardware.cpu.cores} kärnor`}
            detail={`Load: ${hardware.cpu.loadAverage.join(" · ")}`}
          />
          <MetricCard
            icon={HardDrive}
            label="Minne"
            value={`${hardware.memory.heapUsedMb} / ${hardware.memory.heapTotalMb} MB`}
            detail={`System: ${hardware.memory.systemFreeMb} MB ledigt`}
          />
          <MetricCard
            icon={Wifi}
            label="Realtime (SSE)"
            value={`${hardware.realtime.sseConnections} anslutningar`}
            detail={hardware.realtime.status === "ok" ? "Aktiv" : "Ingen aktiv klient"}
          />
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4 sm:col-span-2 xl:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
              Terminaler
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Online" value={hardware.terminals.online} />
              <Stat label="POS" value={hardware.terminals.pos} />
              <Stat label="Kök" value={hardware.terminals.kitchen} />
              <Stat label="Kunddisplay" value={hardware.terminals.customerDisplay} />
              <Stat label="Offline-kö" value={hardware.terminals.offlineTerminals} />
              <Stat label="Totalt" value={hardware.terminals.total} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
              Version
            </p>
            <p className="mt-2 font-serif text-2xl text-white">{hardware.buildVersion}</p>
            <p className="mt-1 text-xs text-white/45">Build {hardware.buildNumber}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
              Databas
            </p>
            <p className="mt-2 text-lg text-white capitalize">{hardware.database.status}</p>
            {hardware.database.message ? (
              <p className="mt-1 text-xs text-white/45">{hardware.database.message}</p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
              Skrivare
            </p>
            <p className="mt-2 text-lg capitalize text-white">{hardware.printers.status}</p>
            <p className="mt-1 text-xs text-white/45">{hardware.printers.note}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-white/45">
        <Icon size={14} />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-lg text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{detail}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p>
      <p className="font-serif text-2xl tabular-nums text-white">{value}</p>
    </div>
  );
}

export function useHardwareOperations() {
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async (operation: string) => {
    setActing(operation);
    setMessage(null);
    try {
      if (operation === "export-logs") {
        const res = await fetch("/api/admin/operations");
        if (!res.ok) throw new Error("Kunde inte exportera loggar");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rms-logs-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("Loggar exporterade.");
        return;
      }

      const res = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Operation failed");
      setMessage(data.message ?? "Klart.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Fel");
    } finally {
      setActing(null);
    }
  }, []);

  return { acting, message, run };
}

export function OperationsPanel() {
  const { acting, message, run } = useHardwareOperations();

  const ops = [
    { id: "restart-realtime", label: "Starta om realtime" },
    { id: "reconnect-printers", label: "Återanslut skrivare" },
    { id: "clear-print-queue", label: "Rensa utskriftskö" },
    { id: "resync-terminals", label: "Synka terminaler" },
    { id: "export-logs", label: "Exportera loggar" },
  ] as const;

  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <h2 className="font-serif text-xl text-white">Driftoperationer</h2>
      <p className="mt-1 text-sm text-white/45">
        Skickas till alla anslutna terminaler via realtime.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {ops.map((op) => (
          <button
            key={op.id}
            type="button"
            disabled={acting !== null}
            onClick={() => void run(op.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={14} className={acting === op.id ? "animate-spin" : ""} />
            {op.label}
          </button>
        ))}
      </div>
      {message ? <p className="mt-4 text-sm text-white/55">{message}</p> : null}
    </section>
  );
}
