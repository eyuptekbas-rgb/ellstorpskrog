import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function resolveModuleDir(): string {
  if (typeof __dirname !== "undefined" && __dirname) {
    return __dirname;
  }
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
}

const DEV_AGENT_DIR = resolveModuleDir();

export type AgentPaths = {
  installDir: string;
  dataDir: string;
  configPath: string;
  queuePath: string;
  logPath: string;
  scriptDir: string;
};

export function getAgentPaths(): AgentPaths {
  const installDir =
    process.env.ELLSTORPS_PRINT_AGENT_HOME?.trim() ||
    process.env.PRINT_AGENT_HOME?.trim() ||
    DEV_AGENT_DIR;

  const dataDir =
    process.env.ELLSTORPS_PRINT_AGENT_DATA?.trim() ||
    process.env.PRINT_AGENT_DATA?.trim() ||
    (process.platform === "win32"
      ? join(process.env.ProgramData || "C:\\ProgramData", "EllstorpsKrog", "PrintAgent")
      : join(installDir, "data"));

  let resolvedDataDir = dataDir;
  try {
    if (!existsSync(resolvedDataDir)) {
      mkdirSync(resolvedDataDir, { recursive: true });
    }
  } catch {
    resolvedDataDir = join(installDir, "data");
    if (!existsSync(resolvedDataDir)) {
      mkdirSync(resolvedDataDir, { recursive: true });
    }
  }

  return {
    installDir,
    dataDir: resolvedDataDir,
    configPath: join(resolvedDataDir, "config.json"),
    queuePath: join(resolvedDataDir, "queue.json"),
    logPath: join(resolvedDataDir, "agent.log"),
    scriptDir: join(installDir, "scripts"),
  };
}
