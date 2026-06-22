import { appendFileSync, existsSync, readFileSync } from "node:fs";
import type { AgentConfig } from "./config";
import { getAgentPaths } from "./paths";

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

export type AgentLogger = {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export function createLogger(config: AgentConfig): AgentLogger {
  const minLevel = LEVELS[config.logLevel] ?? LEVELS.info;
  const { logPath } = getAgentPaths();

  function write(
    level: keyof typeof LEVELS,
    message: string,
    meta?: Record<string, unknown>
  ) {
    if (LEVELS[level] < minLevel) return;
    const line = {
      ts: new Date().toISOString(),
      level,
      service: "ellstorps-print-agent",
      message,
      ...meta,
    };
    const out = JSON.stringify(line);
    if (level === "error" || level === "warn") {
      console.error(out);
    } else {
      console.log(out);
    }
    try {
      appendFileSync(logPath, out + "\n", "utf8");
    } catch {
      // ignore log file errors
    }
  }

  return {
    debug: (message, meta) => write("debug", message, meta),
    info: (message, meta) => write("info", message, meta),
    warn: (message, meta) => write("warn", message, meta),
    error: (message, meta) => write("error", message, meta),
  };
}

export function readRecentLogs(maxLines = 200): string[] {
  const { logPath } = getAgentPaths();
  if (!existsSync(logPath)) return [];
  const content = readFileSync(logPath, "utf8");
  return content.trim().split("\n").slice(-maxLines);
}
