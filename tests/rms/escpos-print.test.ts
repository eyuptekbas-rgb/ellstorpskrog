import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { CMD_CUT, CMD_INIT, GS } from "@/lib/printing/escpos/commands";
import { encodeCashDrawerKick } from "@/lib/printing/escpos/cash-drawer";
import { EscPosEncoder } from "@/lib/printing/escpos/encoder";
import { encodeKitchenTicket } from "@/lib/printing/escpos/kitchen-ticket";
import { encodeReceipt, buildReceiptPaymentInfo } from "@/lib/printing/escpos/receipt";
import { buildReceiptDocument } from "@/lib/printing/receipt";
import { decodeCp850, encodeCp850 } from "@/lib/printing/escpos/text-encoding";
import type { PrintableOrder } from "@/lib/printing/types";

/** Strip ESC/POS control bytes and decode PC850 text for layout assertions. */
function plainEscPosText(bytes: Uint8Array): string {
  const stripped: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    if (b === 0x1b || b === 0x1d || b === 0x1c) {
      i++;
      if (i < bytes.length && bytes[i] === 0x45) i++;
      if (i < bytes.length && bytes[i] === 0x21) i++;
      if (i < bytes.length && bytes[i] === 0x74) i++;
      if (i < bytes.length && bytes[i] === 0x61) i++;
      if (i < bytes.length && bytes[i] === 0x33) i++;
      if (i < bytes.length && bytes[i] === 0x37) i++;
      if (i < bytes.length && bytes[i] === 0x4d) i++;
      if (i < bytes.length && bytes[i] === 0x7b) i++;
      if (i < bytes.length && bytes[i] === 0x2d) i++;
      if (i < bytes.length && bytes[i] === 0x4a) {
        stripped.push(0x0a);
        if (i + 1 < bytes.length) i++;
      }
      continue;
    }
    if (b === 0x10) {
      i += 3;
      continue;
    }
    stripped.push(b);
  }
  return decodeCp850(new Uint8Array(stripped));
}

function containsBytes(bytes: Uint8Array, sequence: number[]): boolean {
  return bytes.some((_, index) =>
    sequence.every((value, offset) => bytes[index + offset] === value)
  );
}

function sampleOrder(): PrintableOrder {
  return {
    orderNumber: "1042",
    customerName: "Anna Test",
    customerPhone: "0701234567",
    customerEmail: "anna@test.se",
    customerAddress: "Storgatan 1",
    orderType: OrderType.DELIVERY,
    paymentMethod: PaymentMethod.SWISH,
    paymentStatus: PaymentStatus.PAID,
    swishConfirmed: true,
    note: "Ring på dörren",
    adminNote: null,
    total: 249,
    status: "NEW",
    estimatedReadyMinutes: 20,
    confirmedAt: "2026-06-19T16:20:00.000Z",
    createdAt: "2026-06-19T12:00:00.000Z",
    items: [
      {
        productName: "Margherita",
        quantity: 2,
        unitPrice: 120,
        totalPrice: 240,
      },
    ],
  };
}

describe("ESC/POS encoder", () => {
  it("builds init, text, and cut sequences", () => {
    const bytes = new EscPosEncoder().line("Hello").encode();
    assert.equal(bytes[0], CMD_INIT[0]);
    assert.ok(bytes.some((b) => b === CMD_CUT[0]));
    const text = new TextDecoder().decode(bytes);
    assert.ok(text.includes("Hello"));
  });

  it("encodes QR commands", () => {
    const bytes = new EscPosEncoder().qr("ORDER:1042").encode();
    assert.ok(bytes.includes(GS));
  });
});

describe("ESC/POS text encoding", () => {
  it("encodes Swedish characters as PC850 single bytes", () => {
    const bytes = encodeCp850("för avhämtning åter");
    assert.equal(bytes.includes(0xc3), false);
    assert.ok(bytes.includes(0x94)); // ö
    assert.ok(bytes.includes(0x84)); // ä
    assert.ok(bytes.includes(0x86)); // å
    assert.equal(decodeCp850(bytes), "för avhämtning åter");
  });

  it("encodes multiplication sign for product lines", () => {
    const bytes = encodeCp850("1 × Vesuvio");
    assert.equal(bytes.includes(0xc3), false);
    assert.ok(bytes.includes(0x9e)); // × in PC850
  });
});

describe("ESC/POS receipt", () => {
  it("requires explicit confirmation and PAID for Swish in every receipt entry point", () => {
    for (const paymentStatus of Object.values(PaymentStatus)) {
      for (const swishConfirmed of [undefined, false, true]) {
        const order = { ...sampleOrder(), paymentStatus, swishConfirmed };
        const confirmed = paymentStatus === PaymentStatus.PAID && swishConfirmed === true;
        const generic = buildReceiptPaymentInfo(order);
        assert.equal(generic.methodLabel === "Swish", confirmed);
        if (!confirmed) assert.equal(generic.swishReference, undefined);
        const normal = plainEscPosText(buildReceiptDocument(order, "Test").escpos);
        const overridden = plainEscPosText(encodeReceipt({ order, restaurant: { name: "Test" },
          payment: { methodLabel: "Swish", swishReference: "MUST-NOT-BYPASS" } }));
        assert.equal(normal.includes("Swish"), confirmed);
        assert.equal(overridden.includes("Swish"), confirmed);
        assert.equal(overridden.includes("MUST-NOT-BYPASS"), confirmed);
      }
    }
  });

  it("cannot inject a Swish receipt label for another payment method", () => {
    const order = { ...sampleOrder(), paymentMethod: PaymentMethod.ON_PICKUP };
    const text = plainEscPosText(encodeReceipt({ order, restaurant: { name: "Test" },
      payment: { methodLabel: "Swish", swishReference: "UNVERIFIED" } }));
    assert.doesNotMatch(text, /Swish|UNVERIFIED/);
  });

  it("uses Font A, maximum density, emphasized body, and height-only headings", () => {
    const bytes = encodeReceipt({
      order: sampleOrder(),
      restaurant: { name: "Ellstorps Krog" },
      payment: { methodLabel: "Betal vid avhämtning" },
    });

    assert.ok(containsBytes(bytes, [0x1b, 0x37, 0xff, 0x01, 0x00]));
    assert.ok(containsBytes(bytes, [0x1b, 0x4d, 0x00]));
    assert.equal(containsBytes(bytes, [0x1b, 0x4d, 0x01]), false);
    assert.ok(containsBytes(bytes, [0x1b, 0x45, 0x01]));
    assert.ok(containsBytes(bytes, [0x1d, 0x21, 0x10]));
    assert.equal(containsBytes(bytes, [0x1d, 0x21, 0x20]), false);
    assert.equal(containsBytes(bytes, [0x1d, 0x21, 0x30]), false);
  });

  it("starts with order information and omits the restaurant header", () => {
    const bytes = encodeReceipt({
      order: sampleOrder(),
      restaurant: {
        name: "Ellstorps Krog",
        address: "Ellstorpsvägen 1",
        phone: "040-123456",
        vatNumber: "556677-8899",
      },
      payment: {
        methodLabel: "Swish",
        swishReference: "ABC123",
      },
      cashier: "Kassa 1",
    });

    const text = plainEscPosText(bytes);
    assert.equal(text.includes("Ellstorps Krog"), false);
    assert.equal(text.includes("Ellstorpsvägen 1"), false);
    assert.match(text, /^Order nr: #1042\s*\nLeverans\s*\nKlar: 18:40/);
    assert.ok(text.includes("PRODUKTER"));
    assert.ok(text.includes("Swish"));
    assert.ok(text.includes("ABC123"));
    assert.ok(text.includes("Delsumma"));
    assert.ok(text.includes("Moms (12%)"));
    assert.ok(text.includes("TOTALT"));
    assert.match(text, /Namn:\s+Anna Test/);
    assert.match(text, /2x Margherita\s+240 kr/);
    assert.ok(text.includes("Meddelande"));
    assert.ok(text.includes("Ring på dörren"));
    assert.equal(text.includes("Tack för ditt besök"), false);
    const hasQr = bytes.some(
      (_, index) =>
        bytes[index] === GS &&
        bytes[index + 1] === 0x28 &&
        bytes[index + 2] === 0x6b
    );
    assert.equal(hasQr, false);
  });

  it("builds receipt document with escpos bytes", () => {
    const doc = buildReceiptDocument(sampleOrder(), "Ellstorps Krog");
    assert.equal(doc.type, "receipt");
    assert.ok(doc.escpos.length > 20);
    assert.equal(doc.escpos[0], CMD_INIT[0]);
  });

  it("is the POS customer receipt renderer (no KÖK header, no QR)", () => {
    const doc = buildReceiptDocument(sampleOrder(), "Ellstorps Krog");
    const text = plainEscPosText(doc.escpos);
    assert.ok(text.startsWith("Order nr: #1042"));
    assert.equal(text.includes("Ellstorps Krog"), false);
    assert.match(text, /Namn:\s+Anna Test/);
    assert.match(text, /Tlf nr:\s+0701234567/);
    assert.ok(text.includes("Delsumma"));
    assert.ok(text.includes("Moms (12%)"));
    assert.ok(text.includes("TOTALT"));
    assert.equal(text.includes("KÖK"), false);
    const hasQr = doc.escpos.some(
      (_, index) =>
        doc.escpos[index] === GS &&
        doc.escpos[index + 1] === 0x28 &&
        doc.escpos[index + 2] === 0x6b
    );
    assert.equal(hasQr, false);
  });

  it("handles missing customer name and phone without breaking labels", () => {
    const doc = buildReceiptDocument(
      { ...sampleOrder(), customerName: "", customerPhone: "" },
      "Ellstorps Krog"
    );
    const text = plainEscPosText(doc.escpos);
    assert.match(text, /Namn:\s+-/);
    assert.match(text, /Tlf nr:\s+-/);
  });

  it("keeps long products, prices, add-ons and Swedish text inside 42 columns", () => {
    const order: PrintableOrder = {
      ...sampleOrder(),
      orderNumber: "EK-000029",
      customerName: "Eyup Tekbas",
      customerPhone: "0548574875842",
      orderType: OrderType.PICKUP,
      total: 571,
      note: null,
      items: [
        { productName: "Laxfilé", quantity: 1, unitPrice: 260, totalPrice: 260 },
        {
          productName: "Margherita med extra långt produktnamn (Extra ost, Färska räkor)",
          quantity: 1,
          unitPrice: 136,
          totalPrice: 136,
        },
        {
          productName: "Gudfadern (Glutenfri botten) — Skär i åtta bitar",
          quantity: 1,
          unitPrice: 175,
          totalPrice: 175,
        },
      ],
    };
    const bytes = encodeReceipt({
      order,
      restaurant: { name: "Ellstorps Krog" },
      payment: { methodLabel: "Kort" },
    });
    const text = plainEscPosText(bytes);
    const lines = text.split("\n").filter(Boolean);

    assert.ok(lines.every((line) => line.length <= 42));
    assert.match(text, /1x Laxfilé\s+260 kr/);
    assert.match(text, /\n  \+ Extra ost\n/);
    assert.match(text, /\n  \+ Färska räkor\n/);
    assert.match(text, /\n  \+ Glutenfri botten\n/);
    assert.match(text, /Namn: Eyup Tekbas/);
    assert.match(text, /Tlf nr: 0548574875842/);
    assert.match(text, /Delsumma\s+571 kr/);
    assert.match(text, /TOTALT\s+571 kr/);
    assert.match(text, /Namn: Eyup Tekbas\n\nTlf nr: 0548574875842/);
    assert.match(text, /Delsumma\s+571 kr\n\nMoms \(12%\)\s+61 kr/);
    assert.match(text, /Betalning: Kort/);
    assert.equal(text.includes("BETALNING\nORDER"), false);
  });

  it("omits payment when persisted payment data is unpaid or pickup-only", () => {
    const doc = buildReceiptDocument(
      {
        ...sampleOrder(),
        paymentMethod: PaymentMethod.ON_PICKUP,
        paymentStatus: PaymentStatus.PENDING,
      },
      "Ellstorps Krog",
      { vatRate: 12 }
    );
    const text = plainEscPosText(doc.escpos);
    assert.equal(text.includes("Betalning:"), false);
    assert.equal(text.includes("Betal vid avhämtning"), false);
  });

  it("prints the persisted paid online method", () => {
    const doc = buildReceiptDocument(sampleOrder(), "Ellstorps Krog", {
      vatRate: 12,
    });
    const text = plainEscPosText(doc.escpos);
    assert.match(text, /Betalning: Swish/);
  });

  it("calculates VAT-inclusive totals at 6% and 12%", () => {
    const order = { ...sampleOrder(), total: 423 };
    const six = plainEscPosText(
      buildReceiptDocument(order, "Ellstorps Krog", { vatRate: 6 }).escpos
    );
    const twelve = plainEscPosText(
      buildReceiptDocument(order, "Ellstorps Krog", { vatRate: 12 }).escpos
    );

    assert.match(six, /Moms \(6%\)\s+24 kr/);
    assert.match(twelve, /Moms \(12%\)\s+45 kr/);
    assert.match(six, /TOTALT\s+423 kr/);
    assert.match(twelve, /TOTALT\s+423 kr/);
  });

  it("reprints the same ready clock time from persisted confirmation", () => {
    const first = plainEscPosText(
      buildReceiptDocument(sampleOrder(), "Ellstorps Krog").escpos
    );
    const reprint = plainEscPosText(
      buildReceiptDocument(sampleOrder(), "Ellstorps Krog").escpos
    );
    assert.match(first, /Klar: 18:40/);
    assert.match(reprint, /Klar: 18:40/);
  });
});

describe("ESC/POS kitchen ticket", () => {
  it("matches Lomma-style kitchen layout", () => {
    const bytes = encodeKitchenTicket({
      order: sampleOrder(),
      restaurantName: "Ellstorps Krog",
      stationName: "KÖK",
      preparationMinutes: 20,
      restaurant: {
        name: "Ellstorps Krog",
        address: "Ellstorpsvägen 1",
        phone: "040-123456",
        vatNumber: "556677-8899",
      },
      payment: {
        methodLabel: "Swish",
        swishReference: "ABC123",
      },
    });

    const text = plainEscPosText(bytes);
    assert.ok(text.includes("LEVERANS"));
    assert.ok(text.includes("ORDER #1042"));
    assert.ok(text.includes("TOTALT"));
    assert.ok(text.includes("BETALD"));
    assert.ok(text.includes("RING PÅ DÖRREN"));
    assert.equal(text.includes("KÖK"), false);
  });
});

describe("ESC/POS cash drawer", () => {
  it("encodes drawer kick command", () => {
    const bytes = encodeCashDrawerKick();
    assert.equal(bytes.length, 5);
    assert.equal(bytes[0], 0x1b);
  });
});

describe("ESC/POS printer status states", () => {
  it("tracks extended hardware states", async () => {
    const { setPrinterStatus, getPrinterStatus } = await import(
      "@/lib/printing/printer-status"
    );
    setPrinterStatus("paper_out", "Papper slut");
    assert.equal(getPrinterStatus().state, "paper_out");
    setPrinterStatus("busy", "Upptagen");
    assert.equal(getPrinterStatus().state, "busy");
  });
});
