import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AgentConfig } from "./config";
import {
  isThermalCandidate,
  pickBestThermalPrinter,
  pickSingleThermalPrinter,
} from "./config";
import type { AgentLogger } from "./logger";
import type { AgentPrinter, PrintJobKind } from "./types";

const execFileAsync = promisify(execFile);

type RawPrinterRow = {
  Name?: string;
  ShareName?: string;
  DriverName?: string;
  PortName?: string;
  PrinterStatus?: number | string;
  Default?: boolean;
  WorkOffline?: boolean;
  JobCount?: number;
};

function decodePrinterStatus(status: number | string | undefined): string {
  if (status === undefined || status === null) return "Unknown";
  if (typeof status === "string") return status;
  if (status === 0) return "Normal";
  if (status === 3) return "Idle";
  if (status === 4) return "Printing";
  return `StatusCode(${status})`;
}

function inferRoles(name: string): string[] {
  const lower = name.toLowerCase();
  const roles: string[] = [];
  if (/(receipt|kvitto|pos-80|pos80)/i.test(lower)) roles.push("receipt");
  if (/(kitchen|kök|kok|kds)/i.test(lower)) roles.push("kitchen");
  if (/(bar)/i.test(lower)) roles.push("bar");
  if (roles.length === 0) roles.push("general");
  return roles;
}

export async function enumerateWindowsPrinters(
  logger: AgentLogger
): Promise<AgentPrinter[]> {
  if (process.platform !== "win32") {
    logger.warn("Printer enumeration skipped — not Windows");
    return [];
  }

  const script = [
    "$printers = Get-Printer -ErrorAction SilentlyContinue",
    "if (-not $printers) { '[]'; exit 0 }",
    "$printers | Select-Object Name, ShareName, DriverName, PortName, PrinterStatus, Default, WorkOffline, JobCount | ConvertTo-Json -Compress",
  ].join("; ");

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 15_000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }
    );

    const trimmed = stdout.trim();
    if (!trimmed) return [];

    const parsed = JSON.parse(trimmed) as RawPrinterRow | RawPrinterRow[];
    const rows = Array.isArray(parsed) ? parsed : [parsed];

    return rows
      .filter((row) => Boolean(row.Name?.trim()))
      .map((row) => {
        const name = row.Name!.trim();
        return {
          name,
          shareName: row.ShareName?.trim() ?? "",
          driverName: row.DriverName?.trim() ?? "",
          portName: row.PortName?.trim() ?? "",
          status: decodePrinterStatus(row.PrinterStatus),
          isDefault: Boolean(row.Default),
          workOffline: Boolean(row.WorkOffline),
          queueJobs: Number(row.JobCount ?? 0),
          escposCapable: isThermalCandidate(name),
          roles: inferRoles(name),
        };
      });
  } catch (err) {
    logger.error("Failed to enumerate Windows printers", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export type ResolvedPrinters = {
  default: string | null;
  receipt: string | null;
  kitchen: string | null;
  bar: string | null;
  drawer: string | null;
  detected: AgentPrinter[];
};

function roleOr(
  configured: string,
  detected: AgentPrinter[],
  role: string,
  fallback: string | null
): string | null {
  if (configured.trim()) return configured.trim();
  const match = detected.find((p) => p.roles.includes(role));
  return match?.name ?? fallback;
}

export async function resolveAgentPrinters(
  config: AgentConfig,
  logger: AgentLogger
): Promise<ResolvedPrinters> {
  const detected = await enumerateWindowsPrinters(logger);
  const names = detected.map((p) => p.name);
  const defaultFromOs = detected.find((p) => p.isDefault)?.name ?? null;
  const autoBest = config.autoDetectPrinter ? pickBestThermalPrinter(names) : null;
  const singleThermal = config.autoDetectPrinter ? pickSingleThermalPrinter(names) : null;

  const defaultPrinter =
    config.defaultPrinter ||
    singleThermal ||
    autoBest ||
    defaultFromOs ||
    names[0] ||
    null;

  const receiptPrinter =
    roleOr(config.receiptPrinter, detected, "receipt", null) ||
    singleThermal ||
    defaultPrinter;

  const kitchenPrinter =
    roleOr(config.kitchenPrinter, detected, "kitchen", null) ||
    singleThermal ||
    defaultPrinter;

  const barPrinter =
    roleOr(config.barPrinter, detected, "bar", null) ||
    singleThermal ||
    defaultPrinter;

  const drawerPrinter =
    config.drawerPrinter.trim() ||
    config.receiptPrinter.trim() ||
    singleThermal ||
    receiptPrinter ||
    defaultPrinter;

  if (singleThermal) {
    logger.info("Auto-selected single thermal printer for all roles", {
      printer: singleThermal,
    });
  }

  return {
    default: defaultPrinter,
    receipt: receiptPrinter,
    kitchen: kitchenPrinter,
    bar: barPrinter,
    drawer: drawerPrinter,
    detected,
  };
}

export function resolvePrinterForKind(
  kind: PrintJobKind,
  requested: string | undefined,
  resolved: ResolvedPrinters
): string | null {
  const explicit = requested?.trim();
  if (explicit) return explicit;

  switch (kind) {
    case "receipt":
      return resolved.receipt ?? resolved.default;
    case "kitchen":
      return resolved.kitchen ?? resolved.default;
    case "bar":
      return resolved.bar ?? resolved.default;
    case "drawer":
      return resolved.drawer ?? resolved.receipt ?? resolved.default;
    case "raw":
      return resolved.default ?? resolved.receipt ?? resolved.kitchen;
    default:
      return resolved.default;
  }
}
