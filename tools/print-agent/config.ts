import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { getAgentPaths } from "./paths";

export type AgentConfig = {
  host: string;
  port: number;
  defaultPrinter: string;
  receiptPrinter: string;
  kitchenPrinter: string;
  barPrinter: string;
  drawerPrinter: string;
  autoDetectPrinter: boolean;
  maxRetries: number;
  retryDelayMs: number;
  logLevel: "debug" | "info" | "warn" | "error";
  configPath: string;
};

const THERMAL_NAME_HINTS = [
  "pos-80",
  "pos80",
  "zq-p",
  "zq_p",
  "thermal",
  "escpos",
  "ellstorps",
  "krog",
  "receipt",
  "kvitto",
  "80mm",
  "xp-",
  "epson",
  "star",
];

function readJsonConfig(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return fallback;
}

export function defaultAgentConfig(configPath: string): AgentConfig {
  return {
    host: "127.0.0.1",
    port: 9211,
    defaultPrinter: "",
    receiptPrinter: "",
    kitchenPrinter: "",
    barPrinter: "",
    drawerPrinter: "",
    autoDetectPrinter: true,
    maxRetries: 3,
    retryDelayMs: 1500,
    logLevel: "info",
    configPath,
  };
}

export function loadAgentConfig(): AgentConfig {
  const paths = getAgentPaths();
  const configPath =
    process.env.PRINT_AGENT_CONFIG?.trim() ||
    process.env.ELLSTORPS_PRINT_AGENT_CONFIG?.trim() ||
    paths.configPath;

  const file = readJsonConfig(configPath);
  const defaults = defaultAgentConfig(configPath);

  return {
    host: process.env.PRINT_AGENT_HOST?.trim() || asString(file.host, defaults.host),
    port: Number(process.env.PRINT_AGENT_PORT ?? file.port ?? defaults.port),
    defaultPrinter:
      process.env.PRINT_AGENT_DEFAULT_PRINTER?.trim() ||
      asString(file.defaultPrinter, defaults.defaultPrinter),
    receiptPrinter:
      process.env.PRINT_AGENT_RECEIPT_PRINTER?.trim() ||
      asString(file.receiptPrinter, defaults.receiptPrinter),
    kitchenPrinter:
      process.env.PRINT_AGENT_KITCHEN_PRINTER?.trim() ||
      asString(file.kitchenPrinter, defaults.kitchenPrinter),
    barPrinter:
      process.env.PRINT_AGENT_BAR_PRINTER?.trim() ||
      asString(file.barPrinter, defaults.barPrinter),
    drawerPrinter:
      process.env.PRINT_AGENT_DRAWER_PRINTER?.trim() ||
      asString(file.drawerPrinter, defaults.drawerPrinter),
    autoDetectPrinter: asBool(
      process.env.PRINT_AGENT_AUTO_DETECT ?? file.autoDetectPrinter,
      defaults.autoDetectPrinter
    ),
    maxRetries: asNumber(process.env.PRINT_AGENT_MAX_RETRIES ?? file.maxRetries, defaults.maxRetries),
    retryDelayMs: asNumber(
      process.env.PRINT_AGENT_RETRY_DELAY_MS ?? file.retryDelayMs,
      defaults.retryDelayMs
    ),
    logLevel: (process.env.PRINT_AGENT_LOG_LEVEL?.trim() ||
      asString(file.logLevel, defaults.logLevel)) as AgentConfig["logLevel"],
    configPath,
  };
}

export function saveAgentConfig(config: AgentConfig): void {
  const payload = {
    host: config.host,
    port: config.port,
    defaultPrinter: config.defaultPrinter,
    receiptPrinter: config.receiptPrinter,
    kitchenPrinter: config.kitchenPrinter,
    barPrinter: config.barPrinter,
    drawerPrinter: config.drawerPrinter,
    autoDetectPrinter: config.autoDetectPrinter,
    maxRetries: config.maxRetries,
    retryDelayMs: config.retryDelayMs,
    logLevel: config.logLevel,
  };
  writeFileSync(config.configPath, JSON.stringify(payload, null, 2), "utf8");
}

export function scoreThermalPrinterName(name: string): number {
  const lower = name.toLowerCase();
  let score = 0;
  if (/pos[- ]?80/.test(lower)) score += 25;
  for (const hint of THERMAL_NAME_HINTS) {
    if (lower.includes(hint)) score += 10;
  }
  if (lower.includes("pdf") || lower.includes("onenote") || lower.includes("fax")) {
    score -= 50;
  }
  return score;
}

export function isThermalCandidate(name: string): boolean {
  return scoreThermalPrinterName(name) > 0;
}

export function pickBestThermalPrinter(names: string[]): string | null {
  if (names.length === 0) return null;
  const ranked = names
    .map((name) => ({ name, score: scoreThermalPrinterName(name) }))
    .sort((a, b) => b.score - a.score);
  if (ranked[0].score <= 0) return null;
  return ranked[0].name;
}

export function pickSingleThermalPrinter(names: string[]): string | null {
  const thermal = names.filter(isThermalCandidate);
  if (thermal.length === 1) return thermal[0];
  return null;
}
