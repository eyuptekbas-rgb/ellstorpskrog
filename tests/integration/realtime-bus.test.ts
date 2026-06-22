import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { subscribeTenant, publishToTenant, totalSseConnections } from "@/lib/realtime/bus";
import type { RealtimeEvent } from "@/lib/realtime/types";

describe("realtime bus integration", () => {
  it("delivers events to tenant subscribers", () => {
    const events: RealtimeEvent[] = [];
    const unsubscribe = subscribeTenant("tenant-test", (event) => {
      events.push(event);
    });

    publishToTenant("tenant-test", {
      type: "OrderUpdated",
      tenantId: "tenant-test",
      at: new Date().toISOString(),
      payload: { orderId: "o1" },
    });

    assert.equal(events.length, 1);
    assert.equal(events[0]?.type, "OrderUpdated");
    assert.equal(totalSseConnections(), 1);
    unsubscribe();
    assert.equal(totalSseConnections(), 0);
  });
});
