import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderType, PaymentStatus } from "@prisma/client";
import { splitOrderByStation, stationLabel } from "@/lib/printing/station-routing";
import type { PrintableOrder } from "@/lib/printing/types";

function sampleOrder(items: PrintableOrder["items"]): PrintableOrder {
  return {
    orderNumber: "1001",
    customerName: "Test",
    customerPhone: "0700000000",
    customerEmail: "t@test.se",
    customerAddress: null,
    orderType: OrderType.PICKUP,
    paymentMethod: "CARD",
    paymentStatus: PaymentStatus.PENDING,
    note: null,
    adminNote: null,
    total: 100,
    status: "NEW",
    createdAt: new Date().toISOString(),
    items,
  };
}

describe("station routing", () => {
  it("routes bar items to bar printer", () => {
    const split = splitOrderByStation(
      sampleOrder([
        { productName: "Margherita", quantity: 1, unitPrice: 120, totalPrice: 120 },
        { productName: "Öl 50cl", quantity: 2, unitPrice: 65, totalPrice: 130 },
      ])
    );
    assert.ok(split.kitchen);
    assert.ok(split.bar);
    assert.equal(split.kitchen?.items.length, 1);
    assert.equal(split.bar?.items.length, 1);
  });

  it("routes dessert items to dessert printer", () => {
    const split = splitOrderByStation(
      sampleOrder([
        { productName: "Chokladtårta", quantity: 1, unitPrice: 79, totalPrice: 79 },
      ])
    );
    assert.ok(split.dessert);
    assert.equal(split.dessert?.items[0]?.productName, "Chokladtårta");
  });

  it("provides station labels", () => {
    assert.equal(stationLabel("kitchen"), "KÖK");
    assert.equal(stationLabel("bar"), "BAR");
  });
});

describe("print dedup", () => {
  it("tracks auto-print completion in memory-less env as no-op safe", async () => {
    const { hasAutoPrintCompleted, markAutoPrintCompleted } = await import(
      "@/lib/printing/print-dedup"
    );
    assert.equal(
      hasAutoPrintCompleted({
        orderId: "x",
        role: "kitchen",
        documentType: "kitchen-ticket",
      }),
      false
    );
    markAutoPrintCompleted({
      orderId: "x",
      role: "kitchen",
      documentType: "kitchen-ticket",
    });
    assert.equal(
      hasAutoPrintCompleted({
        orderId: "x",
        role: "kitchen",
        documentType: "kitchen-ticket",
      }),
      false
    );
  });

  it("tracks READY receipt separately from acceptance auto-print", async () => {
    const storage = new Map<string, string>();
    const previousWindow = globalThis.window;
    const previousStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
        key: () => null,
        length: 0,
      },
      configurable: true,
    });

    try {
      const {
        hasAutoPrintCompleted,
        hasReadyPrintCompleted,
        markAutoPrintCompleted,
        markReadyPrintCompleted,
      } = await import("@/lib/printing/print-dedup");
      const key = {
        orderId: "ready-order",
        role: "receipt" as const,
        documentType: "receipt" as const,
      };

      markAutoPrintCompleted(key);
      assert.equal(hasAutoPrintCompleted(key), true);
      assert.equal(hasReadyPrintCompleted(key), false);

      markReadyPrintCompleted(key);
      assert.equal(hasReadyPrintCompleted(key), true);
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
      });
      Object.defineProperty(globalThis, "localStorage", {
        value: previousStorage,
        configurable: true,
      });
    }
  });
});

describe("printer status", () => {
  it("exposes status subscription", async () => {
    const { getPrinterStatus, setPrinterStatus, subscribePrinterStatus } =
      await import("@/lib/printing/printer-status");
    setPrinterStatus("printing", "Test");
    assert.equal(getPrinterStatus().state, "printing");
    let seen = getPrinterStatus().state;
    subscribePrinterStatus((s) => {
      seen = s.state;
    });
    setPrinterStatus("online");
    assert.equal(seen, "online");
  });
});
