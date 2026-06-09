export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.NODE_ENV !== "production") return;

  const { logError, logWarn } = await import("@/lib/logging/production-logger");

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
