import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { CMD_CUT, CMD_INIT, GS } from "@/lib/printing/escpos/commands";
import { encodeCashDrawerKick } from "@/lib/printing/escpos/cash-drawer";
import { EscPosEncoder } from "@/lib/printing/escpos/encoder";
import { encodeKitchenTicket } from "@/lib/printing/escpos/kitchen-ticket";
import { encodeReceipt } from "@/lib/printing/escpos/receipt";
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
    note: "Ring på dörren",
    adminNote: null,
    total: 249,
    status: "NEW",
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
  it("includes restaurant, order, payment, and total", () => {
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
    assert.ok(text.includes("Ellstorps Krog"));
    assert.ok(text.includes("1042"));
    assert.ok(text.includes("Ordernummer:"));
    assert.ok(text.includes("KUND"));
    assert.ok(text.includes("ARTIKLAR"));
    assert.ok(text.includes("Swish"));
    assert.ok(text.includes("ABC123"));
    assert.ok(text.includes("Total:"));
    assert.match(text, /Namn:\s+Anna Test/);
    assert.match(text, /2x Margherita\.+240 kr/);
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
    assert.ok(text.includes("Ordernummer:"));
    assert.match(text, /Namn:\s+Anna Test/);
    assert.match(text, /Tlf nr:\s+0701234567/);
    assert.ok(text.includes("Total:"));
    assert.equal(text.includes("KÖK"), false);
    const hasQr = doc.escpos.some(
      (_, index) =>
        doc.escpos[index] === GS &&
        doc.escpos[index + 1] === 0x28 &&
        doc.escpos[index + 2] === 0x6b
    );
    assert.equal(hasQr, false);
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
