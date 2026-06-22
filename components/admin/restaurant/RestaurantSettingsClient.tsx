"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_TERMINAL_SETTINGS,
  loadTerminalSettings,
  RESTAURANT_STATUS_LABELS,
  saveTerminalSettings,
  type RestaurantStatus,
  type TerminalSettings,
} from "@/lib/rms/settings";
import {
  loadPrinterRegistry,
  PRINTER_ROLE_LABELS,
  savePrinterRegistry,
  type RegisteredPrinter,
} from "@/lib/printing/printer-registry";
import { listPrinterProviders } from "@/lib/printing/printer";
import {
  DEFAULT_ESCPOS_SETTINGS,
  loadEscPosNetworkSettings,
  saveEscPosNetworkSettings,
  type EscPosNetworkSettings,
} from "@/lib/printing/escpos/config";
import {
  DEFAULT_WINDOWS_PRINTER,
  loadWindowsPrinterSettings,
  saveWindowsPrinterSettings,
  type WindowsPrinterSettings,
} from "@/lib/printing/config/windows-printer-config";

function hasMeaningfulPrinterConfig(
  printers: RegisteredPrinter[],
  windowsPrinter: WindowsPrinterSettings,
  escpos: EscPosNetworkSettings
) {
  const hasNamedWindows = printers.some(
    (p) =>
      (p.providerId === "windows" || p.providerId === "usb") &&
      Boolean(p.windowsPrinterName?.trim())
  );
  const hasGlobalWindows = Boolean(windowsPrinter.printerName.trim());
  const hasNetwork = Boolean(escpos.enabled && escpos.host.trim());
  return hasNamedWindows || hasGlobalWindows || hasNetwork;
}

function RestaurantSettingsClient() {
  const [settings, setSettings] = useState<TerminalSettings>(() =>
    loadTerminalSettings()
  );
  const [printers, setPrinters] = useState<RegisteredPrinter[]>(() =>
    loadPrinterRegistry()
  );
  const [escpos, setEscpos] = useState<EscPosNetworkSettings>(() =>
    loadEscPosNetworkSettings()
  );
  const [windowsPrinter, setWindowsPrinter] = useState<WindowsPrinterSettings>(() =>
    loadWindowsPrinterSettings()
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const localSettings = loadTerminalSettings();
    const localPrinters = loadPrinterRegistry();
    const localEscpos = loadEscPosNetworkSettings();
    const localWindows = loadWindowsPrinterSettings();

    void fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const nextSettings =
          data.rmsTerminalSettings &&
          typeof data.rmsTerminalSettings === "object"
            ? ({ ...DEFAULT_TERMINAL_SETTINGS, ...data.rmsTerminalSettings } as TerminalSettings)
            : localSettings;

        const nextPrinters = Array.isArray(data.rmsPrinterRegistry)
          ? (data.rmsPrinterRegistry as RegisteredPrinter[])
          : localPrinters;

        const nextEscpos =
          data.rmsEscposConfig &&
          typeof data.rmsEscposConfig === "object"
            ? ({ ...DEFAULT_ESCPOS_SETTINGS, ...data.rmsEscposConfig } as EscPosNetworkSettings)
            : localEscpos;

        const nextWindows =
          data.rmsWindowsPrinterConfig &&
          typeof data.rmsWindowsPrinterConfig === "object"
            ? ({ ...DEFAULT_WINDOWS_PRINTER, ...data.rmsWindowsPrinterConfig } as WindowsPrinterSettings)
            : localWindows;

        setSettings(nextSettings);
        setPrinters(nextPrinters);
        setEscpos(nextEscpos);
        setWindowsPrinter(nextWindows);

        saveTerminalSettings(nextSettings);
        savePrinterRegistry(nextPrinters);
        saveEscPosNetworkSettings(nextEscpos);
        saveWindowsPrinterSettings(nextWindows);

        const dbMissingPrinterConfig =
          data.rmsPrinterRegistry == null &&
          data.rmsWindowsPrinterConfig == null &&
          data.rmsEscposConfig == null;

        if (
          dbMissingPrinterConfig &&
          hasMeaningfulPrinterConfig(localPrinters, localWindows, localEscpos)
        ) {
          void fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rmsTerminalSettings: localSettings,
              rmsPrinterRegistry: localPrinters,
              rmsEscposConfig: localEscpos,
              rmsWindowsPrinterConfig: localWindows,
            }),
          }).catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, []);

  const persist = () => {
    saveTerminalSettings(settings);
    savePrinterRegistry(printers);
    saveEscPosNetworkSettings(escpos);
    saveWindowsPrinterSettings(windowsPrinter);
    void fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rmsTerminalSettings: settings,
        rmsPrinterRegistry: printers,
        rmsEscposConfig: escpos,
        rmsWindowsPrinterConfig: windowsPrinter,
      }),
    }).catch(() => undefined);
    void fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "settings",
        action: "Uppdaterade terminalinställningar",
        details: "Restaurant RMS settings/printers saved locally",
      }),
    }).catch(() => undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
            RMS
          </p>
          <h1 className="font-serif text-3xl text-white">Restaurant Settings</h1>
        </div>
        <button
          type="button"
          onClick={persist}
          className="rounded-xl bg-[#b85c38] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {saved ? "Sparat!" : "Spara"}
        </button>
      </header>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="font-serif text-xl text-white">Restaurangstatus</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(RESTAURANT_STATUS_LABELS) as RestaurantStatus[]).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setSettings((s) => ({ ...s, restaurantStatus: status }))
                }
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                  settings.restaurantStatus === status
                    ? "border-[#b85c38]/35 bg-[#b85c38]/12 text-[#e8c4a8]"
                    : "border-white/10 text-white/60"
                }`}
              >
                {RESTAURANT_STATUS_LABELS[status]}
              </button>
            )
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="font-serif text-xl text-white">Kök & terminal</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm text-white/60">
            Köksfördröjning (min)
            <input
              type="number"
              min={0}
              max={120}
              value={settings.kitchenDelayMinutes}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  kitchenDelayMinutes: Number(e.target.value) || 0,
                }))
              }
              className="mt-1.5 w-full max-w-xs rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white"
            />
          </label>
          <ToggleRow
            label="Ljud (globalt)"
            checked={settings.soundEnabled}
            onChange={(v) => setSettings((s) => ({ ...s, soundEnabled: v }))}
          />
          <ToggleRow
            label="POS-ljud"
            checked={settings.posSoundEnabled}
            onChange={(v) => setSettings((s) => ({ ...s, posSoundEnabled: v }))}
          />
          <ToggleRow
            label="Köksljud"
            checked={settings.kitchenSoundEnabled}
            onChange={(v) =>
              setSettings((s) => ({ ...s, kitchenSoundEnabled: v }))
            }
          />
          <ToggleRow
            label="Helskärm som standard (POS/Kök)"
            checked={settings.defaultFullscreen}
            onChange={(v) =>
              setSettings((s) => ({ ...s, defaultFullscreen: v }))
            }
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="font-serif text-xl text-white">Skrivare</h2>
        <ul className="mt-4 space-y-3">
          {printers.map((printer, index) => (
            <li
              key={printer.id}
              className="rounded-2xl border border-white/6 bg-[#0f0f0f] p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={printer.name}
                  onChange={(e) => {
                    const next = [...printers];
                    next[index] = { ...printer, name: e.target.value };
                    setPrinters(next);
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
                />
                <select
                  value={printer.role}
                  onChange={(e) => {
                    const next = [...printers];
                    next[index] = {
                      ...printer,
                      role: e.target.value as RegisteredPrinter["role"],
                    };
                    setPrinters(next);
                  }}
                  className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
                >
                  {Object.entries(PRINTER_ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={printer.providerId}
                  onChange={(e) => {
                    const next = [...printers];
                    next[index] = { ...printer, providerId: e.target.value };
                    setPrinters(next);
                  }}
                  className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
                >
                  {listPrinterProviders().map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ToggleRow
                  label="Aktiv"
                  checked={printer.enabled}
                  onChange={(v) => {
                    const next = [...printers];
                    next[index] = { ...printer, enabled: v };
                    setPrinters(next);
                  }}
                />
              </div>
              <input
                placeholder="Kategori-ID (kommaseparerade)"
                value={printer.categoryIds.join(", ")}
                onChange={(e) => {
                  const next = [...printers];
                  next[index] = {
                    ...printer,
                    categoryIds: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  };
                  setPrinters(next);
                }}
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white/70"
              />
              {(printer.providerId === "network" ||
                printer.providerId === "network-escpos") ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    placeholder="Skrivar-IP (t.ex. 192.168.1.100)"
                    value={printer.networkHost ?? ""}
                    onChange={(e) => {
                      const next = [...printers];
                      next[index] = { ...printer, networkHost: e.target.value };
                      setPrinters(next);
                    }}
                    className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white/70"
                  />
                  <input
                    placeholder="Port (9100)"
                    type="number"
                    value={printer.networkPort ?? 9100}
                    onChange={(e) => {
                      const next = [...printers];
                      next[index] = {
                        ...printer,
                        networkPort: Number(e.target.value) || 9100,
                      };
                      setPrinters(next);
                    }}
                    className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white/70"
                  />
                </div>
              ) : null}
              {printer.providerId === "windows" || printer.providerId === "usb" ? (
                <div className="mt-3">
                  <input
                    placeholder="Windows-skrivarnamn (exakt som i Enheter och skrivare)"
                    value={printer.windowsPrinterName ?? ""}
                    onChange={(e) => {
                      const next = [...printers];
                      next[index] = {
                        ...printer,
                        windowsPrinterName: e.target.value,
                      };
                      setPrinters(next);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white/70"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-2xl border border-white/6 bg-[#0f0f0f] p-4">
          <h3 className="text-sm font-semibold text-white">
            Windows RAW (POS / USB, t.ex. ZQ-P1088)
          </h3>
          <p className="mt-1 text-xs text-white/45">
            Skickar ESC/POS via lokal Print Agent på kassan (
            <code className="text-white/60">http://127.0.0.1:9211</code>
            ). Installera:{" "}
            <code className="text-white/60">npm run print-agent:install</code>{" "}
            eller starta manuellt:{" "}
            <code className="text-white/60">npm run print-agent</code>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={windowsPrinter.printerName}
              onChange={(e) =>
                setWindowsPrinter((s) => ({ ...s, printerName: e.target.value }))
              }
              placeholder="Skrivarnamn (exakt)"
              className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
            />
            <input
              value={windowsPrinter.agentUrl}
              onChange={(e) =>
                setWindowsPrinter((s) => ({ ...s, agentUrl: e.target.value }))
              }
              placeholder="http://127.0.0.1:9211"
              className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/6 bg-[#0f0f0f] p-4">
          <h3 className="text-sm font-semibold text-white">Nätverk ESC/POS (global)</h3>
          <p className="mt-1 text-xs text-white/45">
            Standard-IP för skrivare utan egen adress. Port 9100 (raw TCP).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ToggleRow
              label="Aktivera nätverksskrivare"
              checked={escpos.enabled}
              onChange={(v) => setEscpos((s) => ({ ...s, enabled: v }))}
            />
            <input
              value={escpos.host}
              onChange={(e) => setEscpos((s) => ({ ...s, host: e.target.value }))}
              placeholder="192.168.1.100"
              className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
            />
            <input
              type="number"
              value={escpos.port}
              onChange={(e) =>
                setEscpos((s) => ({ ...s, port: Number(e.target.value) || 9100 }))
              }
              className="w-28 rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="font-serif text-xl text-white">Relaterade inställningar</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <SettingsLink href="/admin/opening-hours" label="Öppettider" />
          <SettingsLink href="/admin/settings" label="Restauranginfo" />
          <SettingsLink href="/admin/notifications" label="Ljud & notiser (e-post)" />
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-white/70">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-white/20"
      />
    </label>
  );
}

function SettingsLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white"
    >
      {label}
    </Link>
  );
}

export default memo(RestaurantSettingsClient);
