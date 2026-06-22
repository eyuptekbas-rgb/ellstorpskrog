import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseTableFromSearchParams,
  formatTableNote,
  buildSelfOrderUrl,
} from "@/lib/self-order/table";
import {
  applyCoupon,
  cartSubtotal,
  cartTotal,
  emptyCart,
  filterCatalog,
  findProductByBarcode,
  resolveCoupon,
  type PosCatalogProduct,
} from "@/lib/pos/quick-sale";
import {
  assignDriver,
  loadDeliveryQueue,
  upsertDeliveryFromOrder,
} from "@/lib/delivery/queue";
import {
  getReportPeriod,
  reconcileCash,
  reportToCsv,
} from "@/lib/reports/sales-report";
import {
  statusToKdsColumn,
  kdsColumnToStatus,
  priorityColor,
} from "@/lib/kitchen/kds-v2";
import { OrderStatus } from "@prisma/client";

describe("self-order table", () => {
  it("parses table from QR url params", () => {
    const params = new URLSearchParams("table=12&qr=1");
    const table = parseTableFromSearchParams(params);
    assert.equal(table.tableName, "12");
    assert.equal(table.source, "qr");
  });

  it("builds table note", () => {
    const note = formatTableNote(
      { tableId: "t1", tableName: "12", source: "qr" },
      "Ingen lök"
    );
    assert.match(note, /Bord: 12/);
    assert.match(note, /Ingen lök/);
  });

  it("builds self order url", () => {
    const url = buildSelfOrderUrl("7", "https://example.com");
    assert.match(url, /\/order\?/);
    assert.match(url, /table=7/);
  });
});

describe("pos quick sale", () => {
  const products: PosCatalogProduct[] = [
    {
      id: "abc12345",
      name: "Pizza",
      price: 120,
      categoryId: "c1",
      categoryName: "Pizza",
      soldOut: false,
      barcode: "12345",
    },
  ];

  it("filters catalog by search", () => {
    assert.equal(filterCatalog(products, "pizza").length, 1);
    assert.equal(filterCatalog(products, "burger").length, 0);
  });

  it("finds product by barcode", () => {
    assert.equal(findProductByBarcode(products, "12345")?.name, "Pizza");
  });

  it("calculates cart totals with coupon", () => {
    let cart = emptyCart();
    cart = {
      ...cart,
      lines: [
        {
          id: "1",
          productId: "p1",
          name: "Test",
          unitPrice: 100,
          quantity: 2,
        },
      ],
    };
    assert.equal(cartSubtotal(cart), 200);
    const withCoupon = applyCoupon(cart, "WELCOME10");
    assert.equal(withCoupon.couponCode, "WELCOME10");
    assert.equal(cartTotal(withCoupon), 180);
  });

  it("resolves welcome coupon", () => {
    assert.ok(resolveCoupon("welcome10"));
  });
});

describe("delivery queue", () => {
  it("upserts and assigns driver", () => {
    const storage = new Map<string, string>();
    (globalThis as { window?: object; localStorage?: Storage }).window = {};
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };

    upsertDeliveryFromOrder({
      id: "o1",
      orderNumber: "A100",
      customerName: "Test",
      customerAddress: "Storgatan 1",
      customerPhone: "0701234567",
      total: 200,
      status: OrderStatus.READY,
    });
    assignDriver("o1", "d1", "Alex", 20);
    const row = loadDeliveryQueue().find((item) => item.orderId === "o1");
    assert.equal(row?.driverName, "Alex");
    assert.equal(row?.deliveryStatus, "assigned");
  });
});

describe("reports", () => {
  it("builds csv export", () => {
    const period = getReportPeriod("x");
    const csv = reportToCsv({
      period,
      grossSales: 1000,
      netSales: 950,
      orderCount: 10,
      cancelledCount: 1,
      averageTicket: 100,
      paymentBreakdown: [],
      cashExpected: 200,
      cardExpected: 800,
      refunds: 50,
    });
    assert.match(csv, /Gross Sales,1000/);
  });

  it("reconciles cash", () => {
    const result = reconcileCash(500, 480, "Test");
    assert.equal(result.variance, -20);
  });
});

describe("kds v2", () => {
  it("maps statuses to columns", () => {
    assert.equal(statusToKdsColumn(OrderStatus.NEW), "new");
    assert.equal(kdsColumnToStatus("ready"), OrderStatus.READY);
  });

  it("returns priority colors", () => {
    assert.equal(priorityColor("rush"), "#ef4444");
  });
});
