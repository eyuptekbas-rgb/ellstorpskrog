"use client";

import { useEffect, useState } from "react";
import { loadEscPosNetworkSettings } from "@/lib/printing/escpos/config";
import { loadWindowsPrinterSettings } from "@/lib/printing/config/windows-printer-config";
import { loadPrinterRegistry } from "@/lib/printing/printer-registry";

function checkPrinterConfigured(): boolean {
  if (typeof window === "undefined") return false;

  const registry = loadPrinterRegistry();
  if (
    registry.some(
      (entry) =>
        Boolean(entry.windowsPrinterName?.trim()) || Boolean(entry.networkHost?.trim())
    )
  ) {
    return true;
  }

  const windows = loadWindowsPrinterSettings();
  if (windows.enabled && windows.printerName.trim()) {
    return true;
  }

  const network = loadEscPosNetworkSettings();
  if (network.enabled && network.host.trim()) {
    return true;
  }

  return false;
}

export function usePosHardwareStatus() {
  const [online, setOnline] = useState(true);
  const [printerReady, setPrinterReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
      setPrinterReady(checkPrinterConfigured());
    };

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    const interval = window.setInterval(sync, 8000);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.clearInterval(interval);
    };
  }, []);

  return { online, printerReady };
}
