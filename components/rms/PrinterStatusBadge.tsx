"use client";

import { useEffect, useRef, useState } from "react";
import {
  getPrinterStatus,
  subscribePrinterStatus,
  setPrinterStatus,
  type PrinterStatusSnapshot,
} from "@/lib/printing/printer-status";
import { checkNetworkPrinterStatus } from "@/lib/printing/providers/network-escpos";
import { useRmsStartup } from "@/lib/rms/startup-context";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";

const LABELS: Record<PrinterStatusSnapshot["state"], string> = {
  online: "Skrivare online",
  offline: "Offline",
  printing: "Skriver ut",
  error: "Skrivarfel",
  paper_out: "Papper slut",
  cover_open: "Lock öppet",
  busy: "Skrivare upptagen",
};

const STATE_CLASS: Record<PrinterStatusSnapshot["state"], string> = {
  online: "text-emerald-300/90 border-emerald-500/20 bg-emerald-500/10",
  offline: "text-amber-300/90 border-amber-500/20 bg-amber-500/10",
  printing: "text-sky-300/90 border-sky-500/20 bg-sky-500/10",
  error: "text-red-300/90 border-red-500/20 bg-red-500/10",
  paper_out: "text-orange-300/90 border-orange-500/20 bg-orange-500/10",
  cover_open: "text-yellow-300/90 border-yellow-500/20 bg-yellow-500/10",
  busy: "text-violet-300/90 border-violet-500/20 bg-violet-500/10",
};

const PROBE_INTERVAL_MS = 60_000;

export default function PrinterStatusBadge() {
  const debug = isPosEmergencyDebug();
  const { backgroundReady } = useRmsStartup();
  const [status, setStatus] = useState<PrinterStatusSnapshot>(() =>
    typeof window !== "undefined"
      ? getPrinterStatus()
      : { state: "online", message: "", updatedAt: "" }
  );
  const [configured, setConfigured] = useState(false);
  const probing = useRef(false);

  useEffect(() => subscribePrinterStatus(setStatus), []);

  useEffect(() => {
    if (debug) return;
    if (!backgroundReady) return;

    const probe = async () => {
      if (probing.current) return;
      if (getPrinterStatus().state === "printing") return;
      probing.current = true;
      try {
        posDebugLog("PRINTER STATUS PROBE START");
        const check = await checkNetworkPrinterStatus();
        setConfigured(check.configured);
        if (!check.configured) return;

        const anyPaperOut = check.statuses.some((s) => s.paperOut);
        const anyCoverOpen = check.statuses.some((s) => s.coverOpen);
        const anyBusy = check.statuses.some((s) => s.busy);
        const anyOffline =
          check.statuses.length > 0 && check.statuses.every((s) => !s.online);
        const anyOnline = check.statuses.some(
          (s) => s.online && !s.paperOut && !s.coverOpen && !s.busy
        );

        if (anyPaperOut) {
          setPrinterStatus("paper_out", "Skrivaren saknar papper");
        } else if (anyCoverOpen) {
          setPrinterStatus("cover_open", "Skrivarens lock är öppet");
        } else if (anyBusy) {
          setPrinterStatus("busy", "Skrivaren är upptagen");
        } else if (anyOffline) {
          setPrinterStatus("offline", "Skrivare svarar inte");
        } else if (anyOnline) {
          setPrinterStatus("online");
        }
      } finally {
        probing.current = false;
      }
    };

    void probe();
    const timer = setInterval(() => void probe(), PROBE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [backgroundReady, debug]);

  if (debug) return null;

  if (!configured || status.state === "online") return null;

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATE_CLASS[status.state]}`}
      role="status"
      aria-live="polite"
      title={status.message}
    >
      {LABELS[status.state]}
    </span>
  );
}
