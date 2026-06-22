"use client";

import { useEffect, useState } from "react";
import AdminAccessGate from "@/components/admin/AdminAccessGate";
import RmsProviders from "@/components/rms/RmsProviders";
import RmsSkipLink from "@/components/rms/RmsSkipLink";
import {
  defaultAdminFeatures,
  type AdminFeatures,
} from "@/lib/tenant/admin-features";
import {
  DEFAULT_TERMINAL_SETTINGS,
  saveTerminalSettings,
  type TerminalSettings,
} from "@/lib/rms/settings";
import {
  loadPrinterRegistry,
  savePrinterRegistry,
  type RegisteredPrinter,
} from "@/lib/printing/printer-registry";
import {
  DEFAULT_ESCPOS_SETTINGS,
  saveEscPosNetworkSettings,
  type EscPosNetworkSettings,
} from "@/lib/printing/escpos/config";
import {
  DEFAULT_WINDOWS_PRINTER,
  loadWindowsPrinterSettings,
  saveWindowsPrinterSettings,
  type WindowsPrinterSettings,
} from "@/lib/printing/config/windows-printer-config";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";
import {
  tracePostHydration,
  tracePosShellSettingsReceived,
} from "@/lib/printing/print-trace-runtime";

type AdminContext = {
  tenant: {
    name: string;
    primaryColor: string;
    active: boolean;
  } | null;
  isPlatformAdmin: boolean;
  adminFeatures: AdminFeatures;
};

export default function PosShell({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    posDebugLog("POS SHELL MOUNT");
    if (isPosEmergencyDebug()) {
      posDebugLog("POS SHELL: skipping /api/admin/context fetch (emergency debug)");
      return;
    }
    void fetch("/api/admin/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setContext(data);
      })
      .catch(() => undefined);

    void fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        tracePosShellSettingsReceived(data);
        if (!data) return;
        if (data.rmsTerminalSettings && typeof data.rmsTerminalSettings === "object") {
          saveTerminalSettings({
            ...DEFAULT_TERMINAL_SETTINGS,
            ...data.rmsTerminalSettings,
          } as TerminalSettings);
        }
        if (Array.isArray(data.rmsPrinterRegistry)) {
          savePrinterRegistry(data.rmsPrinterRegistry as RegisteredPrinter[]);
        }
        if (data.rmsEscposConfig && typeof data.rmsEscposConfig === "object") {
          saveEscPosNetworkSettings({
            ...DEFAULT_ESCPOS_SETTINGS,
            ...data.rmsEscposConfig,
          } as EscPosNetworkSettings);
        }
        if (
          data.rmsWindowsPrinterConfig &&
          typeof data.rmsWindowsPrinterConfig === "object"
        ) {
          saveWindowsPrinterSettings({
            ...DEFAULT_WINDOWS_PRINTER,
            ...data.rmsWindowsPrinterConfig,
          } as WindowsPrinterSettings);
        }
      })
      .catch((err) => {
        console.info("[PRINT-TRACE] PosShell /api/settings fetch failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => {
        tracePostHydration(loadPrinterRegistry(), loadWindowsPrinterSettings());
        setConfigReady(true);
      });
  }, []);

  const adminFeatures = context?.adminFeatures ?? defaultAdminFeatures();
  const isPlatformAdmin = context?.isPlatformAdmin ?? false;
  const tenantActive = context?.tenant?.active ?? true;

  posDebugLog("POS SHELL RENDER", {
    hasContext: Boolean(context),
    tenantActive,
    emergency: isPosEmergencyDebug(),
  });

  return (
    <RmsProviders deferBackgroundUntilOrdersReady>
      <AdminAccessGate
        features={adminFeatures}
        bypassFeatures={isPlatformAdmin}
        tenantActive={tenantActive}
      >
        <RmsSkipLink targetId="pos-main" />
        <div id="pos-main">{configReady ? children : null}</div>
      </AdminAccessGate>
    </RmsProviders>
  );
}
