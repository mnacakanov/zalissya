import { describe, expect, test } from "bun:test";
import { chumakDawn, chumakyPresent, healByDefiance, ostapState } from "./chumaky";

const apply = (flags: Set<string>, add: string[]) => { for (const f of add) flags.add(f); return flags; };

describe("the chumak caravan", () => {
  test("arrives at the dawn of day 2", () => {
    const f = new Set<string>();
    expect(chumakDawn(f, 1)).toEqual([]);
    apply(f, chumakDawn(f, 2));
    expect(chumakyPresent(f)).toBe(true);
    expect(ostapState(f)).toBe("sick");
  });
  test("if nobody helps, Ostap dies at the next dawn, and the caravan leaves the dawn after", () => {
    const f = apply(new Set<string>(), ["chumakyArrivedDay=2"]);
    apply(f, chumakDawn(f, 3));
    expect(ostapState(f)).toBe("dead");
    expect(f.has("ostapDiedDay=3")).toBe(true);
    expect(chumakyPresent(f)).toBe(true);
    apply(f, chumakDawn(f, 4));
    expect(chumakyPresent(f)).toBe(false);
  });
  test("healed Ostap: the caravan feasts tonight and moves on next dawn", () => {
    const f = apply(new Set<string>(), ["chumakyArrivedDay=2", ...healByDefiance(2)]);
    expect(ostapState(f)).toBe("healed");
    apply(f, chumakDawn(f, 3));
    expect(ostapState(f)).toBe("healed");
    expect(chumakyPresent(f)).toBe(false);
  });
});
