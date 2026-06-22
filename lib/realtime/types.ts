export const REALTIME_EVENT_TYPES = [
  "NewOrder",
  "OrderUpdated",
  "KitchenUpdated",
  "TableUpdated",
  "StaffUpdated",
  "RmsOperation",
] as const;

export type RealtimeEventType = (typeof REALTIME_EVENT_TYPES)[number];

export type RealtimeEvent = {
  type: RealtimeEventType;
  tenantId: string;
  payload?: Record<string, unknown>;
  at: string;
};

export type RealtimeSubscriber = (event: RealtimeEvent) => void;
