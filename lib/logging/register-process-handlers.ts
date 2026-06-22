import { logError, logWarn } from "@/lib/logging/production-logger";

export function registerProcessHandlers() {
  process.on("unhandledRejection", (reason) => {
    logError("Unhandled promise rejection", {
      context: "process",
      error: reason,
    });
  });

  process.on("uncaughtException", (error) => {
    logError("Uncaught exception", {
      context: "process",
      error,
    });
  });

  logWarn("Production instrumentation registered", { context: "instrumentation" });
}
