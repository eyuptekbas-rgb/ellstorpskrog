import assert from "node:assert/strict";
import { describe, it } from "node:test";

async function withBrowserStorage(
  storage: Record<string, string | null>,
  run: () => void | Promise<void>
) {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  const mockStorage = {
    getItem(key: string) {
      return key in storage ? storage[key] : null;
    },
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as Storage;

  (globalThis as unknown as { window: Window }).window = globalThis as unknown as Window;
  globalThis.localStorage = mockStorage;

  try {
    await run();
  } finally {
    globalThis.localStorage = originalLocalStorage;
    if (originalWindow === undefined) {
      // @ts-expect-error cleanup test shim
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
}

describe("resolvePrinterStatusTargets", () => {
  it("returns no targets when ESC/POS is disabled and no per-printer host", async () => {
    await withBrowserStorage(
      {
        "rms-escpos-network": JSON.stringify({
          host: "192.168.1.100",
          port: 9100,
          enabled: false,
        }),
        "rms-printer-registry": null,
      },
      async () => {
        const { resolvePrinterStatusTargets } = await import(
          "@/lib/printing/printer-status-targets"
        );
        const targets = resolvePrinterStatusTargets();
        assert.equal(targets.length, 0);
      }
    );
  });

  it("includes global host when ESC/POS is explicitly enabled", async () => {
    await withBrowserStorage(
      {
        "rms-escpos-network": JSON.stringify({
          host: "10.0.0.50",
          port: 9100,
          enabled: true,
        }),
        "rms-printer-registry": null,
      },
      async () => {
        const { resolvePrinterStatusTargets } = await import(
          "@/lib/printing/printer-status-targets"
        );
        const targets = resolvePrinterStatusTargets();
        assert.ok(targets.length >= 1);
        assert.ok(targets.some((t) => t.host === "10.0.0.50"));
      }
    );
  });

  it("uses per-printer networkHost without requiring global enabled", async () => {
    await withBrowserStorage(
      {
        "rms-escpos-network": JSON.stringify({
          host: "192.168.1.100",
          port: 9100,
          enabled: false,
        }),
        "rms-printer-registry": JSON.stringify([
          {
            id: "receipt-default",
            name: "Kvitto",
            role: "receipt",
            providerId: "network",
            categoryIds: [],
            enabled: true,
            networkHost: "192.168.1.55",
          },
        ]),
      },
      async () => {
        const { resolvePrinterStatusTargets } = await import(
          "@/lib/printing/printer-status-targets"
        );
        const targets = resolvePrinterStatusTargets();
        assert.equal(targets.length, 1);
        assert.equal(targets[0]?.host, "192.168.1.55");
      }
    );
  });
});
