import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateLaunchEnv } from "@/lib/env/launch-vars";
import { createBrowserCustomerDisplayProvider } from "@/lib/customer-display/provider";

describe("critical deployment flows", () => {
  it("evaluates launch env checklist shape", () => {
    const items = evaluateLaunchEnv();
    assert.ok(items.length > 0);
    assert.ok(items.some((item) => item.key === "DATABASE_URL"));
    assert.ok(items.some((item) => item.key === "AUTH_SECRET"));
  });
});

describe("customer display provider", () => {
  it("supports push and subscribe in browser-like env", () => {
    const storage = new Map<string, string>();
    const listeners = new Set<(event: Event) => void>();

    const g = globalThis as typeof globalThis & {
      window?: Window & typeof globalThis;
      localStorage?: Storage;
    };

    g.localStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };

    g.window = {
      dispatchEvent: (event: Event) => {
        listeners.forEach((listener) => listener(event));
        return true;
      },
      addEventListener: (_type: string, listener: EventListener) => {
        listeners.add(listener as (event: Event) => void);
      },
      removeEventListener: (_type: string, listener: EventListener) => {
        listeners.delete(listener as (event: Event) => void);
      },
    } as unknown as Window & typeof globalThis;

    const provider = createBrowserCustomerDisplayProvider();
    let latest = null as import("@/lib/customer-display/provider").CustomerDisplayState | null;
    const unsub = provider.subscribe((state) => {
      latest = state;
    });

    provider.push({
      phase: "ordering",
      lines: [{ text: "Hej" }],
      items: [{ name: "Pizza", qty: 1, price: 100 }],
      subtotal: 100,
      discount: 0,
      total: 100,
      updatedAt: new Date().toISOString(),
    });

    assert.equal(latest?.phase, "ordering");
    assert.equal(latest?.total, 100);
    unsub();
  });
});
