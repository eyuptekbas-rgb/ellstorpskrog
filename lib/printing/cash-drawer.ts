import type { CashDrawerProvider } from "./types";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";
import {
  networkCashDrawerProvider,
  usbCashDrawerProvider,
  windowsCashDrawerProvider,
} from "./providers";

const providers: CashDrawerProvider[] = [
  windowsCashDrawerProvider,
  usbCashDrawerProvider,
  networkCashDrawerProvider,
];

function pickDefaultDrawer(): CashDrawerProvider {
  if (typeof navigator !== "undefined" && /Win/i.test(navigator.userAgent)) {
    for (const id of ["windows", "usb", "network"]) {
      const match = providers.find((p) => p.id === id);
      if (match?.canOpen()) return match;
    }
  }
  return providers.find((p) => p.canOpen()) ?? networkCashDrawerProvider;
}

let activeProvider: CashDrawerProvider = pickDefaultDrawer();

export function listCashDrawerProviders(): CashDrawerProvider[] {
  return providers;
}

export function setCashDrawerProvider(id: string): boolean {
  const match = providers.find((provider) => provider.id === id);
  if (!match) return false;
  activeProvider = match;
  return true;
}

export function getCashDrawerProvider(): CashDrawerProvider {
  return activeProvider;
}

export async function openCashDrawer() {
  if (isPosEmergencyDebug()) {
    posDebugLog("OPEN CASH DRAWER BYPASS");
    return { success: true, errorMessage: undefined };
  }

  const provider = activeProvider.canOpen()
    ? activeProvider
    : pickDefaultDrawer();

  return provider.open();
}
