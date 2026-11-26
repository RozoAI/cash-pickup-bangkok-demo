import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAmount } from "../src/bot/amount.ts";
import { detectIntent } from "../src/bot/intent.ts";

describe("parseAmount", () => {
  const ok: [string, number][] = [
    ["I want to pick up 1,000 baht.", 1000],
    ["1,000 baht", 1000],
    ["1000 THB", 1000],
    ["THB 1500", 1500],
    ["฿500", 500],
    ["฿ 2,500", 2500],
    ["pick up 2k baht", 2000],
    ["1.5k", 1500],
    ["3000", 3000],
    ["500 บาท", 500],
    ["can I get 10,000 baht please", 10000],
    ["I'm at Terminal 21 and need 1000 baht", 1000],
  ];
  for (const [text, thb] of ok) {
    it(JSON.stringify(text), () => assert.deepEqual(parseAmount(text), { ok: true, thb }));
  }

  const bad: [string, string][] = [
    ["hello", "no_amount"],
    ["", "no_amount"],
    ["banana baht", "no_amount"],
    ["$50", "wrong_currency"],
    ["50 USD", "wrong_currency"],
    ["20 USDT", "wrong_currency"],
    ["5 baht", "too_small"],
    ["999999 baht", "too_large"],
    ["1000 or 2000", "ambiguous"],
    ["1000 baht or 2000 baht", "ambiguous"],
  ];
  for (const [text, reason] of bad) {
    it(JSON.stringify(text), () => assert.deepEqual(parseAmount(text), { ok: false, reason }));
  }
});

describe("detectIntent", () => {
  it("detects somewhere else without a place", () => {
    assert.deepEqual(detectIntent("I'm somewhere else"), { kind: "elsewhere", place: null });
    assert.deepEqual(detectIntent("change location"), { kind: "elsewhere", place: null });
  });
  it("extracts an explicitly stated place", () => {
    assert.deepEqual(detectIntent("I'm in Chiang Mai"), { kind: "elsewhere", place: "Chiang Mai" });
    assert.deepEqual(detectIntent("I am near Siam Paragon."), { kind: "elsewhere", place: "Siam Paragon" });
  });
  it("maps Park Hyatt back to the default center", () => {
    assert.deepEqual(detectIntent("I'm at the Park Hyatt"), { kind: "use_default" });
  });
  it("does not treat an amount as a place", () => {
    assert.deepEqual(detectIntent("I want to pick up 1,000 baht"), { kind: "other" });
  });
});
