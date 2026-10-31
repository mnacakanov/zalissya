import { describe, expect, test } from "bun:test";
import { carriedWeight } from "./carry";
import { purse, sellHorseshoes } from "./trade";

describe("Radek buys horseshoes", () => {
  test("every forged piece becomes a chervinets", () => {
    const flags = new Set(["forged=4", "fish=2", "chervintsi=3"]);
    expect(sellHorseshoes(flags)).toEqual({ sold: 4, purse: 7 });
    expect(flags.has("forged=4")).toBe(false);
    expect(purse(flags)).toBe(7);
    expect(flags.has("fish=2")).toBe(true);
  });
  test("nothing to sell changes nothing", () => {
    const flags = new Set(["chervintsi=2"]);
    expect(sellHorseshoes(flags)).toEqual({ sold: 0, purse: 2 });
    expect([...flags]).toEqual(["chervintsi=2"]);
  });
  test("selling frees the satchel, and gold weighs nothing", () => {
    const flags = new Set(["forged=7"]);
    expect(carriedWeight(flags)).toBe(14);
    sellHorseshoes(flags);
    expect(carriedWeight(flags)).toBe(0);
  });
});
