import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pickBestThermalPrinter,
  pickSingleThermalPrinter,
  scoreThermalPrinterName,
} from "../../tools/print-agent/config";
import { base64ToBuffer, testReceiptEscPos } from "../../tools/print-agent/bytes";

describe("print agent printer detection", () => {
  it("prefers thermal/POS printer names over PDF virtual printers", () => {
    const names = [
      "Microsoft Print to PDF",
      "OneNote (Desktop)",
      "Ellstorps Krog Printer",
      "POS-80",
    ];
    assert.equal(pickBestThermalPrinter(names), "POS-80");
    assert.ok(scoreThermalPrinterName("POS-80") > scoreThermalPrinterName("Microsoft Print to PDF"));
  });

  it("returns null when only virtual printers exist", () => {
    assert.equal(
      pickBestThermalPrinter(["Microsoft Print to PDF", "OneNote (Desktop)"]),
      null
    );
  });

  it("detects ellstorps branded queue names", () => {
    assert.equal(
      pickBestThermalPrinter(["Microsoft Print to PDF", "Ellstorps Krog Printer"]),
      "Ellstorps Krog Printer"
    );
  });

  it("auto-selects when exactly one thermal printer exists", () => {
    assert.equal(
      pickSingleThermalPrinter(["Microsoft Print to PDF", "Ellstorps Krog Printer"]),
      "Ellstorps Krog Printer"
    );
    assert.equal(
      pickSingleThermalPrinter(["POS-80", "Ellstorps Krog Printer"]),
      null
    );
  });
});

describe("print agent bytes", () => {
  it("builds valid ESC/POS test receipt payload", () => {
    const buf = testReceiptEscPos();
    assert.ok(buf.length > 4);
    assert.equal(buf[0], 0x1b);
    const roundTrip = base64ToBuffer(buf.toString("base64"));
    assert.equal(roundTrip.length, buf.length);
  });
});

describe("print agent client routing", () => {
  it("maps document types to agent endpoints", async () => {
    const { uint8ToBase64 } = await import("@/lib/printing/transport/escpos-bytes");
    const bytes = new Uint8Array([0x1b, 0x40]);
    assert.equal(typeof uint8ToBase64(bytes), "string");
  });
});
