import { OrderStatus } from "@prisma/client";

export type DeliveryStatus =
  | "queued"
  | "assigned"
  | "picked-up"
  | "en-route"
  | "delivered";

export type DeliveryAssignment = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string | null;
  customerPhone: string;
  total: number;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  driverId: string | null;
  driverName: string | null;
  etaMinutes: number | null;
  assignedAt: string | null;
  updatedAt: string;
};

const STORAGE_KEY = "rms-delivery-queue";

export function loadDeliveryQueue(): DeliveryAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeliveryAssignment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDeliveryQueue(rows: DeliveryAssignment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function upsertDeliveryFromOrder(order: {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string | null;
  customerPhone: string;
  total: number;
  status: OrderStatus;
}): DeliveryAssignment {
  const queue = loadDeliveryQueue();
  const existing = queue.find((row) => row.orderId === order.id);
  const now = new Date().toISOString();

  const row: DeliveryAssignment = existing
    ? {
        ...existing,
        customerName: order.customerName,
        customerAddress: order.customerAddress,
        customerPhone: order.customerPhone,
        total: order.total,
        status: order.status,
        updatedAt: now,
      }
    : {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerAddress: order.customerAddress,
        customerPhone: order.customerPhone,
        total: order.total,
        status: order.status,
        deliveryStatus: "queued",
        driverId: null,
        driverName: null,
        etaMinutes: estimateEtaMinutes(order.customerAddress),
        assignedAt: null,
        updatedAt: now,
      };

  const next = existing
    ? queue.map((item) => (item.orderId === order.id ? row : item))
    : [row, ...queue];
  saveDeliveryQueue(next);
  return row;
}

export function assignDriver(
  orderId: string,
  driverId: string,
  driverName: string,
  etaMinutes?: number
) {
  const queue = loadDeliveryQueue();
  const now = new Date().toISOString();
  saveDeliveryQueue(
    queue.map((row) =>
      row.orderId === orderId
        ? {
            ...row,
            driverId,
            driverName,
            deliveryStatus: "assigned",
            assignedAt: now,
            etaMinutes: etaMinutes ?? row.etaMinutes ?? 25,
            updatedAt: now,
          }
        : row
    )
  );
}

export function updateDeliveryStatus(orderId: string, deliveryStatus: DeliveryStatus) {
  const queue = loadDeliveryQueue();
  const now = new Date().toISOString();
  saveDeliveryQueue(
    queue.map((row) =>
      row.orderId === orderId ? { ...row, deliveryStatus, updatedAt: now } : row
    )
  );
}

function estimateEtaMinutes(address: string | null): number {
  if (!address) return 30;
  const len = address.length;
  if (len < 20) return 20;
  if (len < 40) return 30;
  return 40;
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  queued: "I kö",
  assigned: "Tilldelad",
  "picked-up": "Upphämtad",
  "en-route": "På väg",
  delivered: "Levererad",
};
