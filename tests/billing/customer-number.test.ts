import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCustomerNumber,
  isValidCustomerNumber,
} from "../../lib/billing/customer-number";

describe("customer number", () => {
  it("formats 8-digit numbers with leading zeros", () => {
    assert.equal(formatCustomerNumber(1), "00000001");
    assert.equal(formatCustomerNumber(10000002), "10000002");
  });

  it("rejects invalid numbers", () => {
    assert.throws(() => formatCustomerNumber(0));
    assert.throws(() => formatCustomerNumber(100_000_000));
  });

  it("validates format", () => {
    assert.equal(isValidCustomerNumber("00000001"), true);
    assert.equal(isValidCustomerNumber("1234567"), false);
    assert.equal(isValidCustomerNumber("abcd1234"), false);
  });
});
