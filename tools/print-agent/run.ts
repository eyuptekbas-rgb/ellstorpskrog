import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentPaths } from "./paths";
import { startPrintAgent } from "./server";

function logCrash(label: string, err: unknown) {
  const message =
    err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  const line = `${new Date().toISOString()} [${label}] ${message}\n`;
  console.error(line);
  try {
    const { dataDir } = getAgentPaths();
    appendFileSync(join(dataDir, "crash.log"), line, "utf8");
  } catch {
    // ignore
  }
}

process.on("uncaughtException", (err) => {
  logCrash("uncaughtException", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logCrash("unhandledRejection", reason);
  process.exit(1);
});

startPrintAgent().catch((err) => {
  logCrash("startup", err);
  process.exit(1);
});
