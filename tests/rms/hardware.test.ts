import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectPosTerminalProfile, isPosTerminalProfile } from "@/lib/pos/terminal-profile";
import { verifySwishIntegration } from "@/lib/payment/swish-verification";
import { isRmsOperationType } from "@/lib/rms/operations";
import { listCardTerminalProviders } from "@/lib/hardware/card-terminal";

describe("ESC/POS encoder", () => {
  it("builds structured ESC/POS output", async () => {
    const { EscPosEncoder } = await import("@/lib/printing/escpos/encoder");
    const { CMD_INIT, CMD_CUT } = await import("@/lib/printing/escpos/commands");
    const bytes = new EscPosEncoder().line("Line 1").line("Line 2").encode();
    assert.equal(bytes[0], CMD_INIT[0]);
    assert.ok(bytes.some((b) => b === CMD_CUT[0]));
  });
});

describe("ZQ-P108B terminal profile", () => {
  it("detects 1024x768 landscape", () => {
    const profile = detectPosTerminalProfile(1024, 768);
    assert.equal(profile.id, "zq-p108b");
    assert.equal(profile.autoFullscreen, true);
    assert.ok(isPosTerminalProfile(profile));
  });

  it("detects 1280x800 landscape", () => {
    const profile = detectPosTerminalProfile(1280, 800);
    assert.equal(profile.id, "zq-p108b");
  });
});

describe("Swish verification", () => {
  it("reports production readiness when cert and merchant are configured", () => {
    const report = verifySwishIntegration({
      swishMerchantNumber: "1234679304",
      swishCertConfigured: true,
      swishKeyConfigured: true,
      appUrl: "https://example.com",
    });
    assert.equal(report.providerId, "swish");
    assert.ok(report.checks.length >= 5);
    assert.equal(report.productionReady, true);
  });
});

describe("RMS operations", () => {
  it("validates operation types", () => {
    assert.ok(isRmsOperationType("restart-realtime"));
    assert.ok(!isRmsOperationType("invalid"));
  });
});

describe("Card terminal providers", () => {
  it("lists future provider stubs", () => {
    const providers = listCardTerminalProviders();
    assert.equal(providers.length, 4);
    assert.ok(providers.some((p) => p.id === "nets"));
    assert.ok(providers.some((p) => p.id === "stripe-terminal"));
  });
});
