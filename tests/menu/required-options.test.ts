import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findInvalidOptionGroup } from "../../lib/menu/option-group-validation";

const sauceGroup = {
  name: "Valfri sås",
  required: true,
  minSelect: 1,
  maxSelect: 1,
  options: [{ id: "mild" }, { id: "stark" }, { id: "ingen" }],
};

describe("required product option groups", () => {
  it("blocks add/order submission when sauce is omitted", () => {
    assert.equal(findInvalidOptionGroup([sauceGroup], [])?.name, "Valfri sås");
  });

  it("accepts exactly one explicit sauce, including Ingen sås", () => {
    assert.equal(findInvalidOptionGroup([sauceGroup], ["mild"]), null);
    assert.equal(findInvalidOptionGroup([sauceGroup], ["ingen"]), null);
  });

  it("rejects multiple choices in a single-choice group", () => {
    assert.equal(
      findInvalidOptionGroup([sauceGroup], ["mild", "stark"])?.name,
      "Valfri sås"
    );
  });
});
