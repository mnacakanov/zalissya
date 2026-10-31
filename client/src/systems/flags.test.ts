import { describe, expect, test } from "bun:test";
import { bumpCount, counterValue, flagCount, hasCounter, setCount } from "./flags";

describe("counter flags", () => {
  test("a missing counter reads as 0 but counterValue says null", () => {
    const f = new Set(["bread"]);
    expect(flagCount(f, "fish")).toBe(0);
    expect(counterValue(f, "fish")).toBeNull();
    expect(hasCounter(f, "fish")).toBe(false);
  });
  test("setCount replaces every old value and keeps a zero", () => {
    const f = new Set(["fish=3", "fish=9", "bread"]);
    setCount(f, "fish", 0);
    expect([...f].sort()).toEqual(["bread", "fish=0"]);
    expect(hasCounter(f, "fish")).toBe(true);
  });
  test("bumpCount adds, subtracts and returns the new value", () => {
    const f = new Set(["fish=3"]);
    expect(bumpCount(f, "fish", 2)).toBe(5);
    expect(bumpCount(f, "fish", -5)).toBe(0);
    expect(bumpCount(f, "meals", 1)).toBe(1);
    expect([...f].sort()).toEqual(["fish=0", "meals=1"]);
  });
  test("a counter is not confused with one that shares its prefix", () => {
    const f = new Set(["fishTotal=7"]);
    expect(flagCount(f, "fish")).toBe(0);
    expect(hasCounter(f, "fish")).toBe(false);
  });
  test("garbage after the = is skipped, not read as 0", () => {
    const f = new Set(["fish=abc"]);
    expect(counterValue(f, "fish")).toBeNull();
  });
});
