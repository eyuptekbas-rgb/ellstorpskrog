type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  context?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  meta?: Record<string, unknown>;
  timestamp: string;
};

function serializeError(error: unknown): LogPayload["error"] | undefined {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
  };
}

function write(payload: LogPayload) {
  const line = JSON.stringify(payload);
  if (payload.level === "error") {
    console.error(line);
  } else if (payload.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logInfo(
  message: string,
  options?: { context?: string; meta?: Record<string, unknown> }
) {
  write({
    level: "info",
    message,
    context: options?.context,
    meta: options?.meta,
    timestamp: new Date().toISOString(),
  });
}

export function logWarn(
  message: string,
  options?: {
    context?: string;
    error?: unknown;
    meta?: Record<string, unknown>;
  }
) {
  write({
    level: "warn",
    message,
    context: options?.context,
    error: serializeError(options?.error),
    meta: options?.meta,
    timestamp: new Date().toISOString(),
  });
}

export function logError(
  message: string,
  options?: {
    context?: string;
    error?: unknown;
    meta?: Record<string, unknown>;
  }
) {
  write({
    level: "error",
    message,
    context: options?.context,
    error: serializeError(options?.error),
    meta: options?.meta,
    timestamp: new Date().toISOString(),
  });
}

export function isProductionLoggingEnabled() {
  return process.env.NODE_ENV === "production";
}
