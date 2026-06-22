import net from "node:net";
import type { EscPosNetworkConfig } from "./connection";
import {
  CMD_STATUS_BUSY,
  CMD_STATUS_ERROR,
  CMD_STATUS_PAPER,
  concatBytes,
} from "./commands";

export type PrinterHardwareState =
  | "online"
  | "offline"
  | "paper_out"
  | "cover_open"
  | "busy"
  | "error";

export type PrinterHardwareStatus = {
  state: PrinterHardwareState;
  online: boolean;
  paperOut: boolean;
  coverOpen: boolean;
  busy: boolean;
  error?: string;
  checkedAt: string;
};

function mapStatusBytes(paperByte: number, errorByte: number, busyByte: number): PrinterHardwareStatus {
  const checkedAt = new Date().toISOString();
  const paperOut = (paperByte & 0x60) !== 0;
  const coverOpen = (errorByte & 0x04) !== 0;
  const busy = (busyByte & 0x01) !== 0;

  let state: PrinterHardwareState = "online";
  if (paperOut) state = "paper_out";
  else if (coverOpen) state = "cover_open";
  else if (busy) state = "busy";

  return {
    state,
    online: true,
    paperOut,
    coverOpen,
    busy,
    checkedAt,
  };
}

/** Query printer status via DLE EOT status bytes. */
export async function queryPrinterStatus(
  config: EscPosNetworkConfig
): Promise<PrinterHardwareStatus> {
  const host = config.host.trim();
  const port = config.port || 9100;
  const timeoutMs = config.timeoutMs ?? 8_000;
  const checkedAt = new Date().toISOString();

  if (!host || port < 1 || port > 65_535) {
    return {
      state: "offline",
      online: false,
      paperOut: false,
      coverOpen: false,
      busy: false,
      error: "Invalid printer address.",
      checkedAt,
    };
  }

  const statusQuery = concatBytes(CMD_STATUS_PAPER, CMD_STATUS_ERROR, CMD_STATUS_BUSY);

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const responses: number[] = [];

    const finish = (status: PrinterHardwareStatus) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(timeoutMs);
    socket.on("timeout", () =>
      finish({
        state: "offline",
        online: false,
        paperOut: false,
        coverOpen: false,
        busy: false,
        error: "Status query timed out.",
        checkedAt,
      })
    );
    socket.on("error", (err: Error) =>
      finish({
        state: "offline",
        online: false,
        paperOut: false,
        coverOpen: false,
        busy: false,
        error: err.message,
        checkedAt,
      })
    );

    socket.on("data", (chunk: Buffer) => {
      for (const byte of chunk) responses.push(byte);
      if (responses.length >= 3) {
        finish(mapStatusBytes(responses[0] ?? 0, responses[1] ?? 0, responses[2] ?? 0));
      } else if (responses.length >= 2) {
        finish(mapStatusBytes(responses[0] ?? 0, responses[1] ?? 0, 0));
      }
    });

    socket.connect(port, host, () => {
      socket.write(Buffer.from(statusQuery));
    });
  });
}

/** Check whether printer is ready to accept a job. */
export async function isPrinterReady(config: EscPosNetworkConfig): Promise<boolean> {
  const status = await queryPrinterStatus(config);
  return (
    status.online &&
    !status.paperOut &&
    !status.coverOpen &&
    status.state !== "busy"
  );
}

/** Ping by opening a TCP connection. */
export async function pingPrinter(
  host: string,
  port = 9100,
  timeoutMs = 3_000
): Promise<{ reachable: boolean; latencyMs?: number; error?: string }> {
  const started = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (value: { reachable: boolean; latencyMs?: number; error?: string }) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => finish({ reachable: false, error: "Timeout" }));
    socket.on("error", (err: Error) => finish({ reachable: false, error: err.message }));
    socket.connect(port, host, () => finish({ reachable: true, latencyMs: Date.now() - started }));
  });
}
