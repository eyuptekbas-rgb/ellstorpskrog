const STORAGE_KEY = "rms-escpos-network";

export type NetworkEscPosSettings = {
  host: string;
  port: number;
  enabled: boolean;
};

export const DEFAULT_NETWORK_ESCPOS: NetworkEscPosSettings = {
  host: "",
  port: 9100,
  enabled: false,
};

export function loadNetworkEscPosSettings(): NetworkEscPosSettings {
  if (typeof window === "undefined") return DEFAULT_NETWORK_ESCPOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NETWORK_ESCPOS;
    return { ...DEFAULT_NETWORK_ESCPOS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NETWORK_ESCPOS;
  }
}
