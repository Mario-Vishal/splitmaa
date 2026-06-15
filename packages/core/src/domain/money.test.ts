import { describe, expect, it } from "vitest";
import { formatMoney, normalizeAmountText, splitEqually, toCents } from "./money";

describe("money helpers", () => {
  it("converts decimal money to integer cents", () => {
    expect(toCents("12.34")).toBe(1234);
    expect(toCents("$8")).toBe(800);
    expect(normalizeAmountText("₹200", "INR")).toBe(20000);
  });

  it("rejects zero, negative, and over-precise amounts", () => {
    expect(() => toCents("0")).toThrow();
    expect(() => toCents("-1")).toThrow();
    expect(() => toCents("1.234")).toThrow();
  });

  it("splits odd cents without losing money", () => {
    const splits = splitEqually(100, ["a", "b", "c"]);

    expect(splits.map((split) => split.amountCents)).toEqual([34, 33, 33]);
    expect(splits.reduce((sum, split) => sum + split.amountCents, 0)).toBe(100);
  });

  it("formats integer cents", () => {
    expect(formatMoney(1234, "USD")).toBe("$12.34");
  });
});
