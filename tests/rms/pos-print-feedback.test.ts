import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { notifyPrintResult } from "@/lib/pos/print-feedback";

describe("notifyPrintResult", () => {
  it("shows success toast when print succeeds", () => {
    const messages: string[] = [];
    notifyPrintResult(
      (text) => messages.push(text),
      "Kvitto",
      { success: true, providerId: "network" }
    );
    assert.equal(messages[0], "Kvitto skickad till skrivare");
  });

  it("shows error toast when print fails", () => {
    const messages: string[] = [];
    notifyPrintResult(
      (text) => messages.push(text),
      "Köksbiljett",
      {
        success: false,
        providerId: "none",
        errorMessage: "Ingen kökskrivare konfigurerad.",
      }
    );
    assert.equal(messages[0], "Ingen kökskrivare konfigurerad.");
  });
});
