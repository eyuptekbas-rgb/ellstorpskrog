const STORAGE_KEY = "rms-escpos-network";

export type EscPosNetworkSettings = {
  host: string;
  port: number;
  enabled: boolean;
};

export const DEFAULT_ESCPOS_SETTINGS: EscPosNetworkSettings = {
  host: "192.168.1.100",
  port: 9100,
  enabled: false,
};

export function loadEscPosNetworkSettings(): EscPosNetworkSettings {
  if (typeof window === "undefined") return DEFAULT_ESCPOS_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ESCPOS_SETTINGS;
    return { ...DEFAULT_ESCPOS_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ESCPOS_SETTINGS;
  }
}

export function saveEscPosNetworkSettings(settings: EscPosNetworkSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Resolve network config for a registered printer (per-printer overrides global). */
export function resolveEscPosConfig(printer?: {
  networkHost?: string;
  networkPort?: number;
}): EscPosNetworkSettings {
  const global = loadEscPosNetworkSettings();
  if (printer?.networkHost) {
    return {
      host: printer.networkHost,
      port: printer.networkPort ?? global.port,
      enabled: true,
    };
  }
  return global;
}
