/** Re-exports for backward compatibility — use connection.ts / status.ts / discovery.ts */
export {
  sendEscPosToNetwork,
  sendEscPos,
  ESCPOS_DEFAULT_PORT,
  type EscPosNetworkConfig,
  type EscPosSendResult,
  type EscPosConnectionKind,
  type EscPosConnectionTarget,
} from "./connection";

export { queryPrinterStatus, pingPrinter, isPrinterReady } from "./status";

export {
  discoverNetworkPrinters,
  discoverSubnetPrinters,
  subnetHostCandidates,
} from "./discovery";
