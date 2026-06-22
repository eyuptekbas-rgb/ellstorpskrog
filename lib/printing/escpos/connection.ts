import net from "node:net";
import { sendRawToWindowsPrinter } from "@/lib/printing/winraw/spooler";

export type EscPosConnectionKind = "ethernet" | "usb" | "windows" | "android";

export type EscPosNetworkConfig = {
  host: string;
  port: number;
  timeoutMs?: number;
};

export type EscPosSendResult = {
  success: boolean;
  error?: string;
  bytesSent?: number;
};

export type EscPosConnectionTarget = {
  kind: EscPosConnectionKind;
  host?: string;
  port?: number;
  devicePath?: string;
  spoolerName?: string;
  androidServiceId?: string;
  timeoutMs?: number;
};

const DEFAULT_PORT = 9100;
const DEFAULT_TIMEOUT_MS = 8_000;

function validateHost(host: string): boolean {
  return /^[\w.-]+$/.test(host) && host.length <= 253;
}

function validatePort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65_535;
}

/** Send raw ESC/POS bytes over TCP (port 9100). */
export function sendEscPosToNetwork(
  config: EscPosNetworkConfig,
  data: Uint8Array
): Promise<EscPosSendResult> {
  const host = config.host.trim();
  const port = config.port || DEFAULT_PORT;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!validateHost(host)) {
    return Promise.resolve({ success: false, error: "Invalid printer host." });
  }
  if (!validatePort(port)) {
    return Promise.resolve({ success: false, error: "Invalid printer port." });
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result: EscPosSendResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => finish({ success: false, error: "Printer connection timed out." }));
    socket.on("error", (err) =>
      finish({ success: false, error: err.message || "Printer connection failed." })
    );

    socket.connect(port, host, () => {
      socket.write(Buffer.from(data), (writeErr) => {
        if (writeErr) {
          finish({ success: false, error: writeErr.message });
          return;
        }
        socket.end(() => {
          finish({ success: true, bytesSent: data.length });
        });
      });
    });
  });
}

/** Route ESC/POS bytes to the configured transport. */
export async function sendEscPos(
  target: EscPosConnectionTarget,
  data: Uint8Array
): Promise<EscPosSendResult> {
  switch (target.kind) {
    case "ethernet": {
      if (!target.host) {
        return { success: false, error: "Ethernet printer host is required." };
      }
      return sendEscPosToNetwork(
        {
          host: target.host,
          port: target.port ?? DEFAULT_PORT,
          timeoutMs: target.timeoutMs,
        },
        data
      );
    }
    case "usb":
    case "windows": {
      const name = target.spoolerName?.trim();
      if (!name) {
        return {
          success: false,
          error:
            target.kind === "windows"
              ? "Windows spooler printer name is required."
              : "USB printer requires Windows spooler printer name on this host.",
        };
      }
      return sendRawToWindowsPrinter(name, data);
    }
    case "android":
      return {
        success: false,
        error: "Android print service transport is not configured on this server.",
      };
    default:
      return { success: false, error: "Unknown printer connection type." };
  }
}

export const ESCPOS_DEFAULT_PORT = DEFAULT_PORT;
