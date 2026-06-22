export type PrintJobKind = "receipt" | "kitchen" | "bar" | "drawer" | "raw";

export type AgentPrinter = {
  name: string;
  shareName: string;
  driverName: string;
  portName: string;
  status: string;
  isDefault: boolean;
  workOffline: boolean;
  queueJobs: number;
  escposCapable: boolean;
  roles: string[];
};

export type PrintJobRequest = {
  printer?: string;
  base64?: string;
  orderNumber?: string;
  station?: string;
  role?: string;
};

export type AgentConfigPayload = {
  receiptPrinter?: string;
  kitchenPrinter?: string;
  barPrinter?: string;
  drawerPrinter?: string;
  defaultPrinter?: string;
  autoDetectPrinter?: boolean;
};

export type QueuedJob = {
  id: string;
  kind: PrintJobKind;
  printer: string;
  base64: string;
  orderNumber?: string;
  station?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  lastError?: string;
};

export type QueueStats = {
  pending: number;
  processing: boolean;
  completed: number;
  failed: number;
  lastError: string | null;
  lastJobId: string | null;
  persisted: number;
};

export type AgentStatusResponse = {
  ok: boolean;
  service: "ellstorps-print-agent";
  version: string;
  platform: NodeJS.Platform;
  uptimeSec: number;
  startedAt: string;
  queue: QueueStats;
  printers: {
    detected: number;
    default: string | null;
    receipt: string | null;
    kitchen: string | null;
    bar: string | null;
    drawer: string | null;
  };
  config: {
    host: string;
    port: number;
    autoDetectPrinter: boolean;
    configPath: string;
  };
};

export type AgentPrintResponse = {
  success: boolean;
  jobId?: string;
  printer?: string;
  bytesSent?: number;
  error?: string;
  queued?: boolean;
};
