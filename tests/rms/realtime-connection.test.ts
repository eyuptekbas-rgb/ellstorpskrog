import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getRealtimeConnectionState,
  subscribeRealtimeConnection,
} from "@/lib/orders/sse-transport";

describe("realtime connection state", () => {
  it("exposes connection state subscription", () => {
    const states: string[] = [];
    const unsub = subscribeRealtimeConnection((state) => states.push(state));
    assert.ok(["connected", "reconnecting", "offline"].includes(getRealtimeConnectionState()));
    unsub();
    assert.ok(states.length >= 1);
  });
});
