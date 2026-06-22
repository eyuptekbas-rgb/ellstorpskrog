import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { getAgentPaths } from "./paths";
import { sendRawToWindowsPrinter } from "./spooler";
import type { AgentConfig } from "./config";
import type { AgentLogger } from "./logger";
import type { PrintJobKind, QueueStats, QueuedJob } from "./types";

export type EnqueueInput = {
  kind: PrintJobKind;
  printer: string;
  base64: string;
  orderNumber?: string;
  station?: string;
};

export type PrintQueue = {
  enqueue: (input: EnqueueInput) => string;
  getStats: () => QueueStats;
  waitForIdle: (timeoutMs?: number) => Promise<boolean>;
};

type QueueFile = {
  pending: QueuedJob[];
  completed: number;
  failed: number;
  lastError: string | null;
  lastJobId: string | null;
};

function loadQueueFile(): QueueFile {
  const { queuePath } = getAgentPaths();
  if (!existsSync(queuePath)) {
    return { pending: [], completed: 0, failed: 0, lastError: null, lastJobId: null };
  }
  try {
    const parsed = JSON.parse(readFileSync(queuePath, "utf8")) as Partial<QueueFile>;
    return {
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      completed: Number(parsed.completed ?? 0),
      failed: Number(parsed.failed ?? 0),
      lastError: typeof parsed.lastError === "string" ? parsed.lastError : null,
      lastJobId: typeof parsed.lastJobId === "string" ? parsed.lastJobId : null,
    };
  } catch {
    return { pending: [], completed: 0, failed: 0, lastError: null, lastJobId: null };
  }
}

function saveQueueFile(state: QueueFile, logger: AgentLogger) {
  const { queuePath } = getAgentPaths();
  try {
    writeFileSync(queuePath, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    logger.error("Failed to persist print queue", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function createPrintQueue(
  config: AgentConfig,
  logger: AgentLogger
): PrintQueue {
  const restored = loadQueueFile();
  const pending: QueuedJob[] = restored.pending;
  let processing = false;
  let completed = restored.completed;
  let failed = restored.failed;
  let lastError = restored.lastError;
  let lastJobId = restored.lastJobId;
  const idleWaiters: Array<() => void> = [];

  function persist() {
    saveQueueFile(
      { pending, completed, failed, lastError, lastJobId },
      logger
    );
  }

  function notifyIdle() {
    if (pending.length === 0 && !processing) {
      for (const resolve of idleWaiters.splice(0)) resolve();
    }
  }

  function getStats(): QueueStats {
    return {
      pending: pending.length,
      processing,
      completed,
      failed,
      lastError,
      lastJobId,
      persisted: pending.length,
    };
  }

  async function runJob(job: QueuedJob): Promise<boolean> {
    const data = Buffer.from(job.base64, "base64");
    const result = await sendRawToWindowsPrinter(job.printer, new Uint8Array(data));

    if (result.success) {
      logger.info("Print job completed", {
        jobId: job.id,
        kind: job.kind,
        printer: job.printer,
        orderNumber: job.orderNumber ?? null,
        bytesSent: result.bytesSent ?? data.length,
      });
      completed += 1;
      lastJobId = job.id;
      persist();
      return true;
    }

    job.lastError = result.error ?? "Windows RAW print failed.";
    logger.warn("Print job failed", {
      jobId: job.id,
      kind: job.kind,
      printer: job.printer,
      attempt: job.attempts,
      error: job.lastError,
    });
    persist();
    return false;
  }

  async function processQueue() {
    if (processing) return;
    processing = true;

    while (pending.length > 0) {
      const job = pending.shift()!;
      job.attempts += 1;
      persist();

      const ok = await runJob(job);
      if (ok) continue;

      if (job.attempts < job.maxAttempts) {
        logger.info("Requeueing print job", {
          jobId: job.id,
          attempt: job.attempts,
          maxAttempts: job.maxAttempts,
        });
        pending.push(job);
        persist();
        await new Promise((r) => setTimeout(r, config.retryDelayMs));
        continue;
      }

      failed += 1;
      lastError = job.lastError ?? "Print job failed.";
      lastJobId = job.id;
      persist();
      logger.error("Print job exhausted retries", {
        jobId: job.id,
        kind: job.kind,
        printer: job.printer,
        error: lastError,
      });
    }

    processing = false;
    notifyIdle();
  }

  if (pending.length > 0) {
    logger.info("Resuming persisted print queue", { pending: pending.length });
    void processQueue();
  }

  return {
    enqueue(input: EnqueueInput) {
      const job: QueuedJob = {
        id: randomUUID(),
        kind: input.kind,
        printer: input.printer,
        base64: input.base64,
        orderNumber: input.orderNumber,
        station: input.station,
        attempts: 0,
        maxAttempts: config.maxRetries,
        createdAt: new Date().toISOString(),
      };

      pending.push(job);
      persist();
      logger.info("Print job enqueued", {
        jobId: job.id,
        kind: job.kind,
        printer: job.printer,
        orderNumber: job.orderNumber ?? null,
      });

      void processQueue();
      return job.id;
    },
    getStats,
    waitForIdle(timeoutMs = 30_000) {
      if (pending.length === 0 && !processing) {
        return Promise.resolve(true);
      }
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          const idx = idleWaiters.indexOf(onIdle);
          if (idx >= 0) idleWaiters.splice(idx, 1);
          resolve(false);
        }, timeoutMs);
        const onIdle = () => {
          clearTimeout(timer);
          resolve(true);
        };
        idleWaiters.push(onIdle);
      });
    },
  };
}
