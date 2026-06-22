import http from "node:http";
import { loadAgentConfig } from "./config";
import { createLogger } from "./logger";
import { resolveAgentPrinters } from "./printers";
import { createPrintQueue } from "./queue";
import { handleAgentRequest, type AgentContext } from "./router";

export async function startPrintAgent() {
  let config = loadAgentConfig();
  const logger = createLogger(config);
  const queue = createPrintQueue(config, logger);

  const ctx: AgentContext = {
    get config() {
      return config;
    },
    logger,
    queue,
    getResolvedPrinters: () => resolveAgentPrinters(config, logger),
    reloadConfig() {
      config = loadAgentConfig();
    },
  };

  const server = http.createServer((req, res) => {
    handleAgentRequest(ctx, req, res).catch((err) => {
      logger.error("Unhandled agent request error", {
        error: err instanceof Error ? err.message : String(err),
        url: req.url,
      });
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Internal server error" }));
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, () => resolve());
  });

  const resolved = await resolveAgentPrinters(config, logger).catch((err) => {
    logger.error("Printer enumeration failed at startup", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      default: null,
      receipt: null,
      kitchen: null,
      bar: null,
      drawer: null,
      detected: [],
    };
  });
  logger.info("Ellstorps Print Agent started", {
    host: config.host,
    port: config.port,
    configPath: config.configPath,
    defaultPrinter: resolved.default,
    receiptPrinter: resolved.receipt,
    kitchenPrinter: resolved.kitchen,
    barPrinter: resolved.bar,
    drawerPrinter: resolved.drawer,
    detectedPrinters: resolved.detected.map((p) => p.name),
  });

  console.log(
    `Ellstorps Print Agent listening on http://${config.host}:${config.port}`
  );
  console.log(`Configuration UI: http://${config.host}:${config.port}/`);
  console.log(`Diagnostics: http://${config.host}:${config.port}/diagnostics`);

  return server;
}
