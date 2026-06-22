export type RestaurantStatus = "open" | "busy" | "closed";

export type TerminalSettings = {
  restaurantStatus: RestaurantStatus;
  kitchenDelayMinutes: number;
  soundEnabled: boolean;
  posSoundEnabled: boolean;
  kitchenSoundEnabled: boolean;
  autoPrintKitchen: boolean;
  autoPrintReceipt: boolean;
  defaultFullscreen: boolean;
};

const STORAGE_KEY = "rms-terminal-settings";

export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
  restaurantStatus: "open",
  kitchenDelayMinutes: 0,
  soundEnabled: true,
  posSoundEnabled: true,
  kitchenSoundEnabled: true,
  autoPrintKitchen: true,
  autoPrintReceipt: false,
  defaultFullscreen: false,
};

export function loadTerminalSettings(): TerminalSettings {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TERMINAL_SETTINGS;
    return { ...DEFAULT_TERMINAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TERMINAL_SETTINGS;
  }
}

export function saveTerminalSettings(settings: TerminalSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export const RESTAURANT_STATUS_LABELS: Record<RestaurantStatus, string> = {
  open: "Öppen",
  busy: "Hög belastning",
  closed: "Stängd",
};
