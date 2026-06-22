export {
  networkPrinterProvider,
  networkCashDrawerProvider,
  checkNetworkPrinterStatus,
  discoverNetworkPrinters,
  NETWORK_PRINTER_STORAGE_KEY,
  loadNetworkEscPosSettingsLegacy as loadNetworkEscPosSettings,
  saveNetworkEscPosSettings,
  type NetworkEscPosSettings,
} from "./network-printer-provider";

export {
  windowsRawPrinterProvider,
  windowsCashDrawerProvider,
  windowsPrinterProvider,
} from "./windows-raw-printer-provider";

export {
  usbPrinterProvider,
  usbCashDrawerProvider,
  usbDrawer,
} from "./usb-printer-provider";

export { browserPrinterProvider } from "./browser-printer-provider";
export { androidPrinterProvider } from "./android-printer-provider";

export { postNetworkEscPosJob as postEscPosJob } from "../transport/network-escpos-client";

/** @deprecated Use networkPrinterProvider */
export { networkPrinterProvider as networkEscPosProvider } from "./network-printer-provider";

/** @deprecated Use networkCashDrawerProvider */
export { networkCashDrawerProvider as networkEscPosDrawer } from "./network-printer-provider";

export const PRINTER_STATUS_FETCH_TIMEOUT_MS = 3_000;
