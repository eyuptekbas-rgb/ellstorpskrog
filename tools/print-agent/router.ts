import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  base64ToBuffer,
  drawerPulseBuffer,
  testKitchenEscPos,
  testReceiptEscPos,
} from "./bytes";
import { saveAgentConfig } from "./config";
import type { AgentConfig } from "./config";
import type { AgentLogger } from "./logger";
import { getAgentPaths } from "./paths";
import {
  enumerateWindowsPrinters,
  resolveAgentPrinters,
  resolvePrinterForKind,
  type ResolvedPrinters,
} from "./printers";
import type { PrintQueue } from "./queue";
import { sendRawToWindowsPrinter, testOpenPrinter } from "./spooler";
import type {
  AgentConfigPayload,
  AgentPrintResponse,
  AgentStatusResponse,
  PrintJobRequest,
} from "./types";

const AGENT_VERSION = "1.0.0";
const startedAt = new Date().toISOString();

export type AgentContext = {
  config: AgentConfig;
  logger: AgentLogger;
  queue: PrintQueue;
  getResolvedPrinters: () => Promise<ResolvedPrinters>;
  reloadConfig: () => void;
};

let cachedPrinters: ResolvedPrinters | null = null;
let cacheExpiresAt = 0;

async function getResolvedPrintersCached(ctx: AgentContext): Promise<ResolvedPrinters> {
  const now = Date.now();
  if (cachedPrinters && now < cacheExpiresAt) return cachedPrinters;
  cachedPrinters = await resolveAgentPrinters(ctx.config, ctx.logger);
  cacheExpiresAt = now + 30_000;
  return cachedPrinters;
}

export function invalidatePrinterCache() {
  cachedPrinters = null;
  cacheExpiresAt = 0;
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

function sendHtml(res: ServerResponse, html: string) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

function uiPath(name: string): string {
  const paths = getAgentPaths();
  return join(paths.installDir, "ui", name);
}

function loadUiPage(name: string): string {
  const path = uiPath(name);
  if (!existsSync(path)) {
    return `<!DOCTYPE html><html><body><h1>Missing ${name}</h1></body></html>`;
  }
  return readFileSync(path, "utf8");
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function validateBase64Payload(base64: string | undefined): string | null {
  if (!base64?.trim()) return "base64 required";
  try {
    base64ToBuffer(base64.trim());
    return null;
  } catch {
    return "Invalid base64 payload";
  }
}

async function handlePrint(
  ctx: AgentContext,
  kind: "receipt" | "kitchen" | "bar" | "raw",
  body: PrintJobRequest,
  res: ServerResponse
) {
  const base64Error = validateBase64Payload(body.base64);
  if (base64Error) {
    sendJson(res, 400, { success: false, error: base64Error } satisfies AgentPrintResponse);
    return;
  }

  const resolved = await getResolvedPrintersCached(ctx);
  const printer = resolvePrinterForKind(kind, body.printer, resolved);
  if (!printer) {
    sendJson(res, 503, {
      success: false,
      error: "No Windows printer configured or detected on this terminal.",
    } satisfies AgentPrintResponse);
    return;
  }

  const jobId = ctx.queue.enqueue({
    kind,
    printer,
    base64: body.base64!.trim(),
    orderNumber: body.orderNumber,
    station: body.station,
  });

  sendJson(res, 202, {
    success: true,
    queued: true,
    jobId,
    printer,
  } satisfies AgentPrintResponse);
}

async function handleConfigSave(
  ctx: AgentContext,
  body: AgentConfigPayload,
  res: ServerResponse
) {
  const next = { ...ctx.config };
  if (typeof body.receiptPrinter === "string") next.receiptPrinter = body.receiptPrinter.trim();
  if (typeof body.kitchenPrinter === "string") next.kitchenPrinter = body.kitchenPrinter.trim();
  if (typeof body.barPrinter === "string") next.barPrinter = body.barPrinter.trim();
  if (typeof body.drawerPrinter === "string") next.drawerPrinter = body.drawerPrinter.trim();
  if (typeof body.defaultPrinter === "string") next.defaultPrinter = body.defaultPrinter.trim();
  if (typeof body.autoDetectPrinter === "boolean") next.autoDetectPrinter = body.autoDetectPrinter;

  saveAgentConfig(next);
  ctx.reloadConfig();
  invalidatePrinterCache();

  const resolved = await getResolvedPrintersCached(ctx);
  sendJson(res, 200, {
    success: true,
    config: {
      receiptPrinter: next.receiptPrinter,
      kitchenPrinter: next.kitchenPrinter,
      barPrinter: next.barPrinter,
      drawerPrinter: next.drawerPrinter,
      defaultPrinter: next.defaultPrinter,
      autoDetectPrinter: next.autoDetectPrinter,
    },
    selected: {
      receipt: resolved.receipt,
      kitchen: resolved.kitchen,
      bar: resolved.bar,
      drawer: resolved.drawer,
    },
  });
}

export async function handleAgentRequest(
  ctx: AgentContext,
  req: IncomingMessage,
  res: ServerResponse
) {
  const method = req.method ?? "GET";
  const url = req.url?.split("?")[0] ?? "/";

  if (method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (method === "GET" && url === "/") {
    sendHtml(res, loadUiPage("config.html"));
    return;
  }

  if (method === "GET" && url === "/diagnostics") {
    sendHtml(res, loadUiPage("diagnostics.html"));
    return;
  }

  if (method === "GET" && (url === "/health" || url === "/v1/status")) {
    const resolved = await getResolvedPrintersCached(ctx);
    const body: AgentStatusResponse = {
      ok: true,
      service: "ellstorps-print-agent",
      version: AGENT_VERSION,
      platform: process.platform,
      uptimeSec: Math.floor((Date.now() - Date.parse(startedAt)) / 1000),
      startedAt,
      queue: ctx.queue.getStats(),
      printers: {
        detected: resolved.detected.length,
        default: resolved.default,
        receipt: resolved.receipt,
        kitchen: resolved.kitchen,
        bar: resolved.bar,
        drawer: resolved.drawer,
      },
      config: {
        host: ctx.config.host,
        port: ctx.config.port,
        autoDetectPrinter: ctx.config.autoDetectPrinter,
        configPath: ctx.config.configPath,
      },
    };
    sendJson(res, 200, body as unknown as Record<string, unknown>);
    return;
  }

  if (method === "GET" && url === "/v1/printers") {
    const printers = await enumerateWindowsPrinters(ctx.logger);
    const resolved = await getResolvedPrintersCached(ctx);
    sendJson(res, 200, {
      success: true,
      count: printers.length,
      selected: {
        default: resolved.default,
        receipt: resolved.receipt,
        kitchen: resolved.kitchen,
        bar: resolved.bar,
        drawer: resolved.drawer,
      },
      printers,
    });
    return;
  }

  if (method === "GET" && url === "/v1/config") {
    sendJson(res, 200, {
      success: true,
      config: {
        receiptPrinter: ctx.config.receiptPrinter,
        kitchenPrinter: ctx.config.kitchenPrinter,
        barPrinter: ctx.config.barPrinter,
        drawerPrinter: ctx.config.drawerPrinter,
        defaultPrinter: ctx.config.defaultPrinter,
        autoDetectPrinter: ctx.config.autoDetectPrinter,
      },
    });
    return;
  }

  if (method === "GET" && url === "/v1/diagnostics") {
    const resolved = await getResolvedPrintersCached(ctx);
    const target = resolved.receipt ?? resolved.default;
    let openPrinter: { success: boolean; error?: string; win32Code?: number } = {
      success: false,
      error: "No printer selected.",
    };
    let escpos: { success: boolean; error?: string } = {
      success: false,
      error: "No printer selected.",
    };

    if (target) {
      openPrinter = await testOpenPrinter(target);
      const result = await sendRawToWindowsPrinter(
        target,
        new Uint8Array(testReceiptEscPos())
      );
      escpos = result.success
        ? { success: true }
        : { success: false, error: result.error ?? "ESC/POS test failed." };
    }

    sendJson(res, 200, {
      success: true,
      printer: target,
      detected: resolved.detected,
      openPrinter,
      escpos,
      queue: ctx.queue.getStats(),
    });
    return;
  }

  if (method === "POST") {
    let body: PrintJobRequest & AgentConfigPayload = {};
    try {
      const raw = await readBody(req);
      body = (raw ? JSON.parse(raw) : {}) as PrintJobRequest & AgentConfigPayload;
    } catch {
      sendJson(res, 400, { success: false, error: "Invalid JSON body" });
      return;
    }

    if (url === "/v1/config") {
      await handleConfigSave(ctx, body, res);
      return;
    }

    if (url === "/v1/test/receipt") {
      const resolved = await getResolvedPrintersCached(ctx);
      const printer = resolvePrinterForKind("receipt", body.printer, resolved);
      if (!printer) {
        sendJson(res, 503, { success: false, error: "No receipt printer configured." });
        return;
      }
      const jobId = ctx.queue.enqueue({
        kind: "receipt",
        printer,
        base64: testReceiptEscPos().toString("base64"),
      });
      sendJson(res, 202, { success: true, jobId, printer });
      return;
    }

    if (url === "/v1/test/kitchen") {
      const resolved = await getResolvedPrintersCached(ctx);
      const printer = resolvePrinterForKind("kitchen", body.printer, resolved);
      if (!printer) {
        sendJson(res, 503, { success: false, error: "No kitchen printer configured." });
        return;
      }
      const jobId = ctx.queue.enqueue({
        kind: "kitchen",
        printer,
        base64: testKitchenEscPos().toString("base64"),
      });
      sendJson(res, 202, { success: true, jobId, printer });
      return;
    }

    if (url === "/v1/test/open-printer") {
      const resolved = await getResolvedPrintersCached(ctx);
      const printer = body.printer?.trim() || resolved.receipt || resolved.default;
      if (!printer) {
        sendJson(res, 503, { success: false, error: "No printer to test." });
        return;
      }
      const result = await testOpenPrinter(printer);
      sendJson(res, result.success ? 200 : 502, { ...result, printer });
      return;
    }

    if (url === "/v1/test/escpos") {
      const resolved = await getResolvedPrintersCached(ctx);
      const printer = body.printer?.trim() || resolved.receipt || resolved.default;
      if (!printer) {
        sendJson(res, 503, { success: false, error: "No printer to test." });
        return;
      }
      const result = await sendRawToWindowsPrinter(
        printer,
        new Uint8Array(testReceiptEscPos())
      );
      sendJson(res, result.success ? 200 : 502, { ...result, printer });
      return;
    }

    if (url === "/v1/print/receipt") {
      await handlePrint(ctx, "receipt", body, res);
      return;
    }

    if (url === "/v1/print/kitchen") {
      await handlePrint(ctx, "kitchen", body, res);
      return;
    }

    if (url === "/v1/print/bar") {
      await handlePrint(ctx, "bar", body, res);
      return;
    }

    if (url === "/v1/print/raw") {
      await handlePrint(ctx, "raw", body, res);
      return;
    }

    if (url === "/v1/drawer/open") {
      const resolved = await getResolvedPrintersCached(ctx);
      const printer = resolvePrinterForKind("drawer", body.printer, resolved);
      if (!printer) {
        sendJson(res, 503, { success: false, error: "No drawer printer configured." });
        return;
      }

      const jobId = ctx.queue.enqueue({
        kind: "drawer",
        printer,
        base64: drawerPulseBuffer().toString("base64"),
        orderNumber: body.orderNumber,
      });

      sendJson(res, 202, {
        success: true,
        queued: true,
        jobId,
        printer,
      } satisfies AgentPrintResponse);
      return;
    }
  }

  sendJson(res, 404, { success: false, error: "Not found" });
}
